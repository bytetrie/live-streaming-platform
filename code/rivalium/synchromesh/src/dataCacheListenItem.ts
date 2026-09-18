import type Dexie from "dexie"

export interface DataCacheListenItemHandler
{
	onDataCacheTableError: ( error: Error ) => void
} 

export class DataCacheListenItem implements Cache.CacheTable
{
	public columns: string
	
	public table?: Dexie.Table<ListenItem, string>

	private empty: ListenItem[]

	constructor( public name: string, private handler: DataCacheListenItemHandler )
	{
		const columns: ( keyof ListenItem )[] = [
			`endpoint`,
			`label`,
			`playing`,
			`listenMode`,
			`buffering`,
			`noData`,
			`type`,
			`outputState`,
			`connectedStreams`,
			`redirect`,
			`local`,
			`remoteURL`
		]

		this.columns = columns.join( `, ` )

		this.empty = []
	}
	
	public setTable( cache: Dexie ): void
	{
		this.table = cache.table( this.name )
	}

	public async load(): Promise<ListenItem[]>
	{
		const items = await this.table?.toArray() ?? this.empty

		for ( const item of items )
		{
			item.playing = false

			item.outputState = []

			if ( !item.created ) item.created = new Date()

			this.update( item.endpoint, item )
		}

		return items
	}

	public add( item: ListenItem ): void
	{
		this.table?.add( item )
	}

	public update( endpoint: URL, item: Partial<ListenItem> ): void
	{
		const data = {
			...item, 
			connectedStreams: [] as ( {id?: string, url: string}[] | undefined )
		}

		if ( !item.connectedStreams ) delete data.connectedStreams

		for ( const { url, id } of item.connectedStreams ?? [] )
		{
			data.connectedStreams?.push( { id, url: url.toString() } )
		}

		this.table
			?.update( endpoint.toString(), item )
			.catch( this.handler.onDataCacheTableError )
	}

	public remove( endpoint: URL ): void
	{
		this.table
			?.delete( endpoint.toString() )
			.catch( this.handler.onDataCacheTableError )
	}
}