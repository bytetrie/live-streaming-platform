enum MonitorState
{
	notMonitoring = `Not monitoring`,
	monitoring = `Monitoring`
}

export class DataModelSourceItem implements SourceItem
{
	public label: string

	public monitoringState: MonitorState

	public connectedRecordingIDs: URL[]

	constructor( public endpoint: URL, public refID: string, channel?: number )
	{
		this.label = `Source channel ${channel !== undefined ? ( channel + 1 ) : new Date().toLocaleString()}`

		this.monitoringState = MonitorState.notMonitoring

		this.connectedRecordingIDs = []
	}

	public serialize(): Serialized<SourceItem>
	{
		return {
			...this,
			endpoint: this.endpoint.toString(),
			connectedRecordingIDs: this.connectedRecordingIDs.map( id => id.toString() )
		}
	}

	public static serializePartial( data: Partial<SourceItem> ): Partial<Serialized<SourceItem>>
	{
		const _data: Partial<Serialized<SourceItem>> = {}

		for ( const key in data )
		{
			const k = key as keyof typeof data

			if ( k === `endpoint` )
			{
				const value = data[ k ]

				if ( value ) _data[ k ] = value.toString()
				else _data[ k ] = undefined

				continue
			}

			if ( k === `connectedRecordingIDs` )
			{
				const value = data[ k ]

				if ( value ) _data[ k ] = value.map( id => id.toString() )
				else _data[ k ] = []

				continue
			}
			
			// TODO: fix any
			_data[ k ] = ( data[ k ] as any )
		}
		
		return _data
	}

	public static clone( _item: SourceItem ): DataModelSourceItem
	{
		return DataModelSourceItem.fromSerialized( _item )
	}

	public static fromSerialized( data: SourceItem ): DataModelSourceItem
	{
		const model = new DataModelSourceItem( new URL( data.endpoint.toString() ), data.refID )

		model.label = data.label

		model.monitoringState = data.monitoringState

		for ( const item of data.connectedRecordingIDs )
		{
			model.connectedRecordingIDs.push( new URL( item.toString() ) )
		}

		return model
	}
}