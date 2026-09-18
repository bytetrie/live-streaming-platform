import { nanoid } from "nanoid"

export interface CreateGroupResponse
{
	id: string
	url: URL
}

export interface AddStreamToGroupResponse
{
	id: string
}

export interface APIGroupHandler
{
	onRequestError: ( error: Error ) => void
}

export class APIGroup implements API
{
	private create: string

	private mock: boolean

	private contentTypeHeader: Headers

	private encoder: TextEncoder

	private mockResponse: {
		create: () => CreateGroupResponse
		add: () => AddStreamToGroupResponse
	}

	constructor(
		private handler: APIGroupHandler,
		private baseURL: string,
		private mockTime: number = 100 )
	{
		this.getGroup = this.getGroup.bind( this )

		this.addStream = this.addStream.bind( this )

		this.removeStream = this.removeStream.bind( this )
		/**
		 * TODO:
		 * 	- check URL
		 * 	- check request methods and data
		 */

		this.create = ( new URL( `/group/create`, this.baseURL ) ).toString()

		this.mock = false

		this.contentTypeHeader = new Headers()

		this.contentTypeHeader.append( `content-type`, `text/plain` )

		this.encoder = new TextEncoder()

		/**
		 * TODO: the URLs maybe should be built from provider functions
		 */
		this.mockResponse = {
			create: () =>
			{
				const id = nanoid()

				return {
					id,
					url: new URL( `/group/${id}`, baseURL ),
				}
			},
			add: () => ( {
				id: nanoid()
			} )
		}
	}

	public getGroup(): Promise<CreateGroupResponse>
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
				fetch( this.create, { method: `POST` } )
					.then( res => 
					{
						if ( res.status !== 200 )
							throw Error( `Request failed` )
						else return res
					} )
					.then( data => data.text() )
					.then( id => 
					{
						resolve( {
							id,
							url: new URL( `/group/${id}`, this.baseURL )
						} )
					} )
					.catch( e => this.handler.onRequestError( e ) )
			}
		} )
	}

	public addStream( url: URL, groupURL: URL ): Promise<AddStreamToGroupResponse>
	{
		return new Promise( resolve =>
		{
			if ( this.mock )
			{
				setTimeout( () =>
				{
					resolve( this.mockResponse.add() )
				}, this.mockTime )
			}
			else
			{

				fetch( groupURL.toString(), { 
					method: `PUT`,
					headers: this.contentTypeHeader, 
					body: this.encoder.encode( url.toString() ) } )
					.then( res => 
					{
						if ( res.status !== 200 )
							throw Error( `Request failed` )
						else return res
					} )
					.then( data => data.text() )
					.then( id => resolve( { id } ) )
					.catch( this.handler.onRequestError )
			}
		} )
	}

	public removeStream( id: string, groupURL: URL ): Promise<void>
	{
		return new Promise( resolve =>
		{
			if ( this.mock )
			{
				setTimeout( resolve, this.mockTime )
			}
			else
			{
				fetch( groupURL.toString(), { 
					method: `DELETE`, 
					headers: this.contentTypeHeader, 
					body: this.encoder.encode( id ) } )
					.then( res => 
					{
						if ( res.status !== 200 )
							throw Error( `Request failed` )
						else return res
					} )
					.then( () => resolve() )
					.catch( this.handler.onRequestError )
			}
		} )
	}

	public setMock( mock: boolean ): void
	{
		this.mock = mock
	}
}