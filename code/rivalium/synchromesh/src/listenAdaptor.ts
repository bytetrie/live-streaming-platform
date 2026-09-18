import { nanoid } from "nanoid"
import { Syllid, SyllidContextInterface } from "syllid"

export interface SyllidAdaptorHandler
{
	onLoadOutputs: () => void

	onError: ( error: string | Error | ErrorEvent ) => void
}

export enum OutputState
{
	muted = `Muted`,
	active = `Active`
}


/**
 * Playing/ Stopping listen streams
 * - Adds/Removes URLs from syllid
 * - If adding:
 * 	- check URLs added length
 * 	- if URLs = 1
 * 		- set active channels to play
 * - if removing:
 * 	- check URLs added length
 * 	- if URLs = 0
 * 		- set channels to stop
 * 
 * Active/mute output channels
 * - Change output state
 * - Set channel channel to play/stop
 */
export class SyllidAdaptor implements SyllidContextInterface, ListenAdaptor
{
	private syllid?: Syllid

	private outputMap: Record<string, number>

	private outputState: ( OutputItem & {channel: number} )[]

	private urlCount: number

	private URLMap: Record<string, URL | undefined>

	constructor( private handler: SyllidAdaptorHandler )
	{
		this.bindFns()

		this.outputMap = {}

		this.outputState = []

		this.urlCount = 0

		this.URLMap = {}
	}

	private bindFns()
	{
		this.onFailure = this.onFailure.bind( this )

		this.onWarning = this.onWarning.bind( this )

		this.activateOutput = this.activateOutput.bind( this )

		this.muteOutput = this.muteOutput.bind( this )

		this.playURL = this.playURL.bind( this )

		this.stopURL = this.stopURL.bind( this )

		this.init = this.init.bind( this )
	}

	private async init()
	{
		this.syllid = new Syllid( this )

		await this.syllid?.init()

		for ( let i = 0; i < this.syllid.getChannels(); i++ )
		{
			const id = nanoid()

			this.outputMap[ id ] = i

			this.outputState.push( {
				id,
				label: `Output ${i + 1}`,
				// Initialise listenAdaptor with active inputs
				state: OutputState.active,
				channel: i
			} )
		}

		this.handler.onLoadOutputs()
	}

	public outputs(): OutputItem[]
	{
		return this.outputState
	}

	public async activateOutput( id: string ): Promise<this>
	{
		try
		{
			if ( !this.syllid ) await this.init()

			const channel = this.outputState[ this.outputMap[ id ] ]

			if ( channel.state === OutputState.active ) return this

			channel.state = OutputState.active

			if ( this.urlCount > 0 )
			{
				this.syllid?.playChannel( channel.channel )
			}
		}
		catch ( e )
		{
			this.handler.onError( e )
		}
	
		return this
	}

	public async muteOutput( id: string ): Promise<this>
	{
		try
		{
			if ( !this.syllid ) await this.init()

			const channel = this.outputState[ this.outputMap[ id ] ]

			if ( channel.state === OutputState.muted ) return this

			channel.state = OutputState.muted

			this.syllid?.stopChannel( channel.channel )
		}
		catch ( e )
		{
			this.handler.onError( e )
		}

		return this
	}

	public async playURL( url: URL ): Promise<this>
	{
		try
		{
			if ( !this.syllid ) await this.init()

			const _url = url.toString()

			if ( this.URLMap[ _url ] !== undefined )
				throw Error( `URL ${_url} already added.` )

			this.URLMap[ _url ] = url

			this.urlCount += 1

			this.syllid?.addURL( url )

			// User has just clicked "play" on audio
			// However, the output channels need to be
			// activated, as this is equivalent to
			// turning audio on from an off state
			if ( this.urlCount === 1 )
			{
				for ( const channel of this.outputState )
				{
					if( channel.state === OutputState.active )
					{
						this.syllid?.playChannel( channel.channel )
					}
				}
			}
		}
		catch ( e )
		{
			this.handler.onError( e )
		}

		return this
	}

	public async stopURL( url: URL ): Promise<this>
	{
		try
		{
			if ( !this.syllid ) await this.init()

			const _url = url.toString()

			if ( this.URLMap[ _url ] === undefined )
				throw Error( `URL ${_url} not added.` )
	
			this.urlCount -= 1
	
			this.URLMap[ _url ] = undefined
	
			this.syllid?.removeURL( url )
	
			if ( this.urlCount === 0 )
			{
				for ( const channel of this.outputState )
				{
					if( channel.state === OutputState.active )
					{
						this.syllid?.stopChannel( channel.channel )
					}
				}
			}
		}
		catch ( e )
		{
			this.handler.onError( e )
		}

		return this
	}

	public async toggleURL( url: URL ): Promise<boolean>
	{
		const _url = url.toString()

		if ( this.URLMap[ _url ] === undefined )
		{
			await this.playURL( url )

			return true
		}
		else
		{
			await this.stopURL( url )

			return false
		}
	}

	public onWarning( message: string | Error | ErrorEvent ): void
	{
		// TODO: handle warning 
		
		console.warn( message )
	}

	public onFailure( error: string | Error | ErrorEvent ): void
	{
		this.handler.onError( error )
	}

}