import { nanoid } from "nanoid"

export interface ListenURLs
{
	publicURL: URL
	listenURL: URL
}

export interface RecordingURLs
{
	adminURL: URL
	recordingURL: URL
}

export type CreateRecordingResponse =
	& ListenURLs
	& RecordingURLs 

export interface APIRecordingHandler
{
	onRequestError: ( error: Error ) => void
}

export class APIRecording implements API
{
	private create: string

	private mock: boolean

	private mockResponse: {
		create: () => CreateRecordingResponse
	}

	constructor( private handler: APIRecordingHandler, private baseURL: string, private mockTime: number = 100 )
	{
		this.getRecordingEndpoint = this.getRecordingEndpoint.bind( this )

		this.create = ( new URL( `/api/stream`, baseURL ) ).toString()

		this.mock = false

		/**
		 * TODO: the URLs maybe should be built from provider functions
		 */
		this.mockResponse = {
			create: () => ( { 
				recordingURL: new URL( `/recording/${nanoid()}`, baseURL ),
				listenURL: new URL( `/stream/${nanoid()}`, baseURL ),
				adminURL: new URL( `/${nanoid()}/admin`, baseURL ),
				publicURL: new URL( `/${nanoid()}`, baseURL )
			} )
		}
	}

	// extract values from data returned from sludge
	// {
	//	"admin":"http://localhost:7778/xjhr41py-UnMGAFBsxGl/admin",
	//		-> http://localhost:6660/recording/xjhr41py-UnMGAFBsxGl
	//	"public":"http://localhost:7778/t9upYMbIqHzsB6xacDAs"
	//		-> http://localhost:6660/listen/t9upYMbIqHzsB6xacDAs
	// }
	private transformCreateData( _adminURL: string, _publicURL: string ): CreateRecordingResponse
	{
		const adminURL = new URL( _adminURL )

		const publicURL = new URL( _publicURL )

		const adminID = adminURL.pathname.split( `/` )[ 2 ]

		const publicID = publicURL.pathname.split( `/` )[ 2 ]

		if ( !adminID || !publicID )
		{
			throw Error( `Could not retrieve recording endpoint IDs from provided API data.` )
		}
		
		// TODO: construct URLs from provider function
		return ( {
			adminURL,
			publicURL,
			recordingURL: new URL( `/recording/${adminID}`, this.baseURL ),
			listenURL: new URL( `/stream/${publicID}`, this.baseURL )
		} )
	}

	/**
	 * 
	 * @param url (optional) If provided, fetch data for URL, otherwise it will create one
	 * @returns adminURL, publicURL, recordingURL, listenURL
	 */
	public getRecordingEndpoint( url?: URL ): Promise<CreateRecordingResponse | void>
	{
		return new Promise( resolve =>
		{
			if ( this.mock )
			{
				setTimeout( () =>
				{
					resolve( this.mockResponse.create() )
				}, this.mockTime )
			}
			else
			{

				fetch( url ? url.toString() : this.create, { method: url ? `GET` : `POST` } )
					.then( res => 
					{
						if ( res.status !== 200 )
							throw Error( `Request failed` )
						else return res
					} )
					.then( data => data.json() )
					.then( ( { public: publicURL, admin: adminURL } ) => 
						resolve( this.transformCreateData( adminURL, publicURL ) ) )
					.catch( error =>
					{
						this.handler.onRequestError( error )

						resolve()
					} )
			}
		} )
	}

	public setMock( mock: boolean ): void
	{
		this.mock = mock
	}

	public listenURLsFromID( id: string ): ListenURLs
	{
		return {
			listenURL: new URL( `/stream/${id}`, this.baseURL ),
			publicURL: new URL( `/api/${id}`, this.baseURL )
		}
	}

	public recordingURLsFromID( id: string ): RecordingURLs
	{
		return {
			recordingURL: new URL( `/recording/${id}`, this.baseURL ),
			adminURL: new URL( `/api/${id}/admin`, this.baseURL )
		}
	}
}