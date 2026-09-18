import type Dexie from "dexie"

export interface DataCacheRecordingItemHandler
{
	onDataCacheTableError: ( error: Error ) => void
}

enum RecordingState
{
	notRecording = `Not recording`,
	recording = `Recording`
}

export class DataCacheRecordingItem implements Cache.CacheTable
{
	public columns: string
	
	public table?: Dexie.Table<RecordingItem, string>

	private empty: RecordingItem[]

	constructor( public name: string, private handler: DataCacheRecordingItemHandler )
	{
		const columns: ( keyof RecordingItem )[] = [
			`endpoint`,
			`label`,
			`created`,
			`state`,
			`listen`,
			`sourceID`,
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

	public async load(): Promise<RecordingItem[]>
	{
		const items = await this.table?.toArray() ?? this.empty

		for ( const item of items )
		{
			item.state = RecordingState.notRecording

			item.sourceID = undefined

			this.update( item.endpoint, item )
		}

		return items
	}

	public add( item: RecordingItem ): void
	{
		this.table
			?.add( item )
			.catch( this.handler.onDataCacheTableError )
	}

	public update( endpoint: URL, item: Partial<RecordingItem> ): void
	{
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