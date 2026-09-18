import type Dexie from "dexie"

export interface DataCacheSourceItemHandler
{
	onDataCacheTableError: ( error: Error ) => void
} 

export class DataCacheSourceItem implements Cache.CacheTable
{
	public columns: string
	
	public table?: Dexie.Table<SourceItem, string>

	private empty: SourceItem[]

	constructor( public name: string, private handler: DataCacheSourceItemHandler )
	{
		const columns: ( keyof SourceItem )[] = [
			`endpoint`,
			`label`,
			`monitoringState`,
			`connectedRecordingIDs`,
			`refID`
		]

		this.columns = columns.join( `, ` )

		this.empty = []
	}
	
	public setTable( cache: Dexie ): void
	{
		this.table = cache.table( this.name )
	}

	public async load(): Promise<SourceItem[]>
	{
		this.table?.clear()

		return this.empty
	}

	public add( item: SourceItem ): void
	{
		this.table?.add( item )
	}

	public update( endpoint: URL, item: Partial<SourceItem> ): void
	{
		const data = {
			...item, 
			connectedRecordingIDs: [] as ( string[] | undefined )
		}

		if ( !item.connectedRecordingIDs ) delete data.connectedRecordingIDs

		for ( const url of item.connectedRecordingIDs ?? [] )
		{
			data.connectedRecordingIDs?.push( url.toString() )
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