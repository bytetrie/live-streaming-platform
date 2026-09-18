import type { DataCache } from "./dataCache"
import { DataModelListenItem } from "./dataModelListenItem"
import { DataModelRecordingItem } from "./dataModelRecordingItem"
import { DataModelSourceItem } from "./dataModelSourceItem"

export interface StateItemsHandler
{
	onCacheLoaded: () => void
	onCacheError: ( error: Error ) => void
}

export enum Table
{
	recordingItems = `recordingItems`,
	listenItems = `listenItems`,
	sourceItems = `sourceItems`,
}

interface CurrentState
{
	listen?: ListenItem
	recording?: RecordingItem
	source?: SourceItem
}

interface ItemsState
{
	listen: Record<string, ListenItem>,
	recording: Record<string, RecordingItem>,
	source: Record<string, SourceItem>,
}

export class StateItems
{
	private _items: ItemsState

	private _current: CurrentState

	private keyTableMap: Record<Table, keyof ItemsState>

	private tableToConstructor: {
		[Table.listenItems]: typeof DataModelListenItem,
		[Table.recordingItems]: typeof DataModelRecordingItem,
		[Table.sourceItems]: typeof DataModelSourceItem
	}

	private sourceRefToEndpoint: Record<string, URL>

	constructor( private handler: StateItemsHandler, private db?: DataCache )
	{
		this.updateCurrentRecordingItem = this.updateCurrentRecordingItem.bind( this )

		this.updateCurrentListenItem = this.updateCurrentListenItem.bind( this )

		this.updateCurrentSourceItem = this.updateCurrentSourceItem.bind( this )

		this._current = {}

		this._items = {
			listen: {},
			recording: {},
			source: {}
		}

		this.keyTableMap = {
			[ Table.listenItems ]: `listen`,
			[ Table.recordingItems ]: `recording`,
			[ Table.sourceItems ]: `source`
		}

		this.tableToConstructor = {
			[ Table.listenItems ]: DataModelListenItem,
			[ Table.recordingItems ]: DataModelRecordingItem,
			[ Table.sourceItems ]: DataModelSourceItem
		}

		this.sourceRefToEndpoint = {}
	}

	public get items(): ItemsState
	{
		return this._items
	}

	public get current(): CurrentState
	{
		return this._current
	}

	public sourceKey( reference: string ): URL
	{
		if ( !this.sourceRefToEndpoint[ reference ] )
		{
			throw Error( `Source reference not found ${reference}` )
		}

		return this.sourceRefToEndpoint[ reference ]
	}

	public loadCache(): void
	{
		if ( !this.db )
		{
			this.handler.onCacheLoaded()

			return
		}
		
		let count = 0

		const counter = () =>
		{
			count += 1

			if ( count === 3 ) this.handler.onCacheLoaded()
		}

		this.db?.loadTable<RecordingItem>( Table.recordingItems )
			.then( data => 
			{
				for ( const item of data )
				{
					const model = DataModelRecordingItem.fromSerialized( item )

					this._items[ this.keyTableMap[ Table.recordingItems ] ][ model.endpoint.toString() ] = model
				}
			} )
			.then( counter )
			.catch( this.handler.onCacheError )

		this.db?.loadTable<ListenItem>( Table.listenItems )
			.then( data => 
			{
				for ( const item of data )
				{
					const model = DataModelListenItem.fromSerialized( item )

					this._items[ this.keyTableMap[ Table.listenItems ] ][ model.endpoint.toString() ] = model
				}
			} )
			.then( counter )
			.catch( this.handler.onCacheError )

		this.db?.loadTable<SourceItem>( Table.sourceItems )
			.then( data => 
			{
				for ( const item of data )
				{
					const model = DataModelSourceItem.fromSerialized( item )

					this._items[ this.keyTableMap[ Table.sourceItems ] ][ model.endpoint.toString() ] = model
				}
			} )
			.then( counter )
			.catch( this.handler.onCacheError )
	}

	public updateCurrentRecordingItem( id: string ): this
	{
		if ( !this._items.recording[ id ] )
		{
			throw Error( `Recording not found ${id}` )
		}

		this.current.recording = this.items.recording[ id ]

		return this
	}

	public updateCurrentListenItem( id: string ): this
	{
		if ( !this.items.listen[ id ] )
		{
			throw Error( `Stream not found ${id}` )
		}

		this.current.listen = this.items.listen[ id ]

		return this
	}

	public updateCurrentSourceItem( id: string ): this
	{
		if ( !this.items.source[ id ] )
		{
			throw Error( `Source not found ${id}` )
		}

		this.current.source = this.items.source[ id ]

		return this
	}

	public update( id: URL, type: Table.listenItems, data: Partial<ListenItem> ): void

	public update( id: URL, type: Table.sourceItems, data: Partial<SourceItem> ): void

	public update( id: URL, type: Table.recordingItems, data: Partial<RecordingItem> ): void

	public update( id: URL, type: Table, data: Partial<ListenItem | SourceItem | RecordingItem> ): void
	{
		Object.assign( this._items[ this.keyTableMap[ type ] ][ id.toString() ], data )

		this.db?.updateItemInTable( type, id, this.tableToConstructor[ type ].serializePartial( data ) )
	}

	public add( type: Table.listenItems, data: DataModelListenItem ): void

	public add( type: Table.sourceItems, data: DataModelSourceItem ): void

	public add( type: Table.recordingItems, data: DataModelRecordingItem ): void

	public add( type: Table, data: DataModelListenItem | DataModelSourceItem | DataModelRecordingItem ): void
	{
		this._items[ this.keyTableMap[ type ] ][ data.endpoint.toString() ] = data

		this.db?.addItemToTable( type, data.serialize() )

		if ( type === Table.sourceItems )
		{
			this.sourceRefToEndpoint[ ( data as DataModelSourceItem ).refID ] = data.endpoint
		}
	}

	public remove( type: Table.listenItems, key: URL ): void

	public remove( type: Table.sourceItems, key: URL ): void

	public remove( type: Table.recordingItems, key: URL ): void

	public remove( type: Table, key: URL ): void
	{
		if ( type === Table.sourceItems )
		{
			delete this.sourceRefToEndpoint[ this._items.source[ key.toString() ].refID ]
		}

		delete this._items[ this.keyTableMap[ type ] ][ key.toString() ]

		this.db?.removeItemFromTable( type, key )
	}
}