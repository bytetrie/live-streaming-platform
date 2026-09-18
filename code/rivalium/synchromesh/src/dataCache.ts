import Dexie from 'dexie'

export class DataCache extends Dexie
{
	private t: Cache.CacheTable[]

	private lu: Record<string, number>
	
	constructor() 
	{
		super( `SynchroDB` )

		this.t = []

		this.lu = {}
	}

	public async loadTable<T>( tableName: string ): Promise<T[]>
	{
		return this.t[ this.lu[ tableName ] ].load()
	}

	public addItemToTable<T>( tableName: string, item: Serialized<T> ): void
	{
		this.t[ this.lu[ tableName ] ].add( item )
	}

	public updateItemInTable<T>( tableName: string, id: URL, item: Partial<Serialized<T>> ): void
	{
		this.t[ this.lu[ tableName ] ].update( id, item )
	}

	public removeItemFromTable( tableName: string, id: URL ): void
	{
		this.t[ this.lu[ tableName ] ].remove( id )
	}

	public addTable<T extends Cache.CacheTable>( table: T ): this
	{
		this.lu[ table.name ] = this.t.length

		this.t.push( table )

		return this
	}

	public setTables(): this
	{
		const stores: Record<string, string> = {}

		for( const table of this.t )
		{
			stores[ table.name ] = table.columns
		}

		this.version( 1 ).stores( stores )

		for( const table of this.t )
		{
			table.setTable( this )
		}

		return this
	}
}