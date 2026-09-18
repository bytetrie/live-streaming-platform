import { OnUploadedData, Splutter, SplutterContextInterface } from "splutter"

export interface SplutterAdaptorHandler
{
	onInputDeviceActivated: ( channels: string[] ) => void
	onInputDeviceDeactivated: ( channels: string[] ) => void
	onError: ( error: Error ) => void
	handleUploadForEndpoints: ( file: File, endpoints: URL[] ) => void
	handleMappedFile: ( file: File, urls: string[] ) => void
}

interface EndpointData
{
	endpoint: URL
	recordingIndex: number
	uploadingIndex: number
	connectedIndex: number
	sourceID: string
	remoteURL?: URL
}

export class SplutterAdaptor implements SplutterContextInterface, RecordingAdaptor
{
	public handlePostUpload: boolean

	private splutter: Splutter

	private channels: number

	private idToChannelMap: Record<string, number>

	private channelToIDMap: Record<number, string>

	private uploadingToEndpointMap: Record<string, string>

	// Quick lookup if endpoint already connected
	private endpoints: Record<string, EndpointData>

	// endpoints (incl. internal) that are associated with source segments
	private recording: Record<string, URL[]>

	// endpoints (excl. internal) that will have source segments uploaded
	private uploading: Record<string, URL[]>

	// all endpoints associated with a source (regardless of recording/internal)
	private connected: Record<string, {endpoint: URL, internal: boolean}[]>

	constructor( private handler: SplutterAdaptorHandler )
	{
		this.handlePostUpload = true
		
		this.splutter = new Splutter( this )
		
		this.idToChannelMap = {}

		this.channelToIDMap = {}

		this.uploadingToEndpointMap = {}

		this.recording = {}

		this.uploading = {}

		this.connected = {}

		this.endpoints = {}

		this.channels = 0
	}

	private initSource( sourceID: string )
	{
		if ( !this.connected[ sourceID ] ) this.connected[ sourceID ] = []

		if ( !this.recording[ sourceID ] ) this.recording[ sourceID ] = []

		if ( !this.uploading[ sourceID ] ) this.uploading[ sourceID ] = []
	}

	public inputDeviceActivate(): void
	{
		this.splutter.startCapture()
			.then( channels =>
			{
				if ( !channels ) return

				const { id, inputChannels } = this.splutter.inputDeviceInformation()

				this.channels = inputChannels

				const ids: string[] = []

				for ( let i = 0; i < inputChannels; i++ )
				{
					const c = `${id}_${i}`
					
					ids.push( c )

					this.channelToIDMap[ i ] = c

					this.idToChannelMap[ c ] = i

					this.recording[ c ] = []
				}

				this.handler.onInputDeviceActivated( ids )
			} )
			.catch( error => this.handler.onError( error ) )
	}
	
	public inputDeviceDeactivate(): void
	{
		this.splutter.stopCapture()

		this._inputDeviceDeactivate()
	}

	public onDevicePermissionRemoved(): void
	{
		this._inputDeviceDeactivate()
	}

	private _inputDeviceDeactivate(): void
	{
		const ids: string[] = []

		const endpoints: [URL, string][] = []

		for ( let i = 0; i < this.channels; i++ )
		{
			const id = this.channelToIDMap[ i ]

			ids.push( id )

			if ( this.connected[ id ] )
			{
				for ( let j = 0; j < this.connected[ id ].length; j++ )
				{
					endpoints.push( [ this.connected[ id ][ j ].endpoint, id ] )
				}
			}
		}

		this.channels = 0

		Promise.all(
			endpoints.map( ( [ endpoint, sourceID ] ) => this.endpointForSourceRemove( sourceID, endpoint ) )
		)
			.then( () =>
			{
				for ( let i = 0; i < ids.length; i++ )
				{
					const id = ids[ i ]

					delete this.connected[ id ]

					delete this.recording[ id ]

					delete this.uploading[ id ]

					delete this.idToChannelMap[ id ]
		
					delete this.channelToIDMap[ i ]
				}
			
				this.handler.onInputDeviceDeactivated( ids )
			} )
			.catch( error => this.handler.onError( error ) )
	}
	
	// internal = not uploadable
	// add endpoint to list of "connected"
	public endpointForSourceAdd( sourceID: string, endpoint: URL, remoteURL?: URL ): Promise<void>
	{
		return new Promise( ( resolve, reject ) =>
		{
			const _endpoint = endpoint.toString()

			if ( _endpoint in this.endpoints )
				return reject( Error( `Endpoint ${_endpoint} already connected.` ) )
	
			this.initSource( sourceID )
	
			this.endpoints[ _endpoint ] = {
				endpoint,
				sourceID,
				remoteURL,
				uploadingIndex: -1,
				recordingIndex: -1,
				connectedIndex: this.connected[ sourceID ].length,
			}
	
			this.connected[ sourceID ].push( { endpoint, internal: remoteURL === undefined } )

			resolve()
		} )
	}
	
	// remove endpoint from all connected/recording/upload states
	public endpointForSourceRemove( sourceID: string, endpoint: URL ): Promise<void>
	{
		return new Promise( ( resolve, reject ) =>
		{
			const _endpoint = endpoint.toString()

			if ( !( _endpoint in this.endpoints ) )
				return reject( Error( `Can't remove unknown endpoint ${_endpoint} from source ${sourceID}.` ) )
	
			this.connected[ sourceID ].splice( this.endpoints[ _endpoint ].connectedIndex, 1 )
	
			if ( this.endpoints[ _endpoint ].recordingIndex !== -1 )
				this.endpointRecordingStop( endpoint )
	
			delete this.endpoints[ _endpoint ]

			resolve()
		} )
	}

	// add connected endpoint to recording state
	// add "non-internal" endpoint to uploading state
	// enable recording on connected source if not already
	// - set source to "recording"
	public endpointRecordingStart( endpoint: URL ): Promise<void>
	{
		return new Promise<void>( ( resolve, reject ) =>
		{
			const _endpoint = endpoint.toString()

			if ( !( _endpoint in this.endpoints ) )
				return reject( Error( `Can't record for endpoint ${_endpoint}, not connected.` ) )

			const { sourceID, remoteURL } = this.endpoints[ _endpoint ]

			if ( remoteURL !== undefined )
			{
				this.endpoints[ _endpoint ].uploadingIndex = this.uploading[ sourceID ].length

				this.uploading[ sourceID ].push( remoteURL )

				this.uploadingToEndpointMap[ remoteURL.toString() ] = _endpoint
			}

			this.endpoints[ _endpoint ].recordingIndex = this.recording[ sourceID ].length

			this.recording[ sourceID ].push( endpoint )
			
			if ( this.recording[ sourceID ].length === 1 )
				this.splutter.recordInputChannel( this.idToChannelMap[ sourceID ] )

			resolve()
		} )
	}

	// remove from recording/uploading states
	// if only endpoint connected to source, stop source recording
	public endpointRecordingStop( endpoint: URL ): Promise<void>
	{
		return new Promise<void>( ( resolve, reject ) => 
		{
			const _endpoint = endpoint.toString()

			if ( !( _endpoint in this.endpoints ) )
				return reject( Error( `Can't stop recording for endpoint ${_endpoint}, not connected.` ) )

			const { sourceID } = this.endpoints[ _endpoint ]

			if ( this.endpoints[ _endpoint ].uploadingIndex !== -1 )
			{
				this.uploading[ sourceID ].splice( this.endpoints[ _endpoint ].uploadingIndex, 1 )

				this.endpoints[ _endpoint ].uploadingIndex = -1
			}

			this.endpoints[ _endpoint ].recordingIndex = -1

			this.recording[ sourceID ].splice( this.endpoints[ _endpoint ].recordingIndex, 1 )
			
			if ( this.recording[ sourceID ]?.length === 0 )
				this.splutter.stopRecordInputChannel( this.idToChannelMap[ sourceID ] )

			resolve()
		} )
	}
	
	public monitorSourceStart( sourceID: string ): void
	{
		this.splutter.unmuteOutputChannelForInputChannel( this.idToChannelMap[ sourceID ], 0 )
	}
	
	public monitorSourceEnd( sourceID: string ): void
	{
		this.splutter.muteOutputChannelForInputChannel( this.idToChannelMap[ sourceID ], 0 )
	}

	public onWarning( message: string | Error | ErrorEvent ): void
	{
		if ( typeof message === `string` )
		{
			this.handler.onError( Error( message ) )
		}
		else if ( `message` in message )
		{
			this.handler.onError( Error( message.message ) )
		}
	}

	public onFailure( error: Error ): void
	{
		this.handler.onError( error )
	}

	// get upload state
	public getStreamURLsForChannel( channel: number ): URL[]
	{
		return this.uploading[ this.channelToIDMap[ channel ] ]
	}
	
	public onUploaded( data: OnUploadedData[], form: FormData, channel: number ): void
	{
		const file = form.get( `audio` )

		// why would this happen?
		if ( !file || typeof file === `string` ) return

		this.handler.handleUploadForEndpoints(
			file,
			this.recording[ this.channelToIDMap[ channel ] ] )

		Promise.all( data.map( ( { response } ) => response?.text() ) )
			.then( ( urls ) => 
				this.handler.handleMappedFile( file, this.getMappedEndpoint( urls ) ) )
	}

	private getMappedEndpoint( urls: ( string | undefined )[] )
	{
		const endpoints = []

		for ( const url of urls )
		{
			if ( !url ) continue

			const endpoint = this.uploadingToEndpointMap[ url ]

			if ( endpoint ) endpoints.push( endpoint )
		}

		return endpoints
	}
}