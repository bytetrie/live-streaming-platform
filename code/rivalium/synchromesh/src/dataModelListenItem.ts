enum ListenItemType
{
	mine = `Your recording`,
	shared = `Shared with you`,
	group = `Group`
}

enum OutputState
{
	muted = `Muted`,
	active = `Active`
}

export class DataModelListenItem implements ListenItem
{
	public created: Date

	public label: string

	public playing: boolean

	public listenMode: `live` | `progress` | `random`

	public buffering: boolean

	public noData: boolean

	public outputState: OutputState[]

	public connectedStreams?: GroupStream[]

	public redirect?: URL

	constructor(
		public endpoint: URL,
		public type: ListenItemType,
		public remoteURL?: URL,
		public local: boolean = false )
	{
		this.created = new Date()

		this.label = `${type} added ${this.created.toLocaleString()}`

		this.playing = false

		/**
		 * Due to implementation constraints,
		 * these will be set to show the active
		 * random view by default
		 */
		this.listenMode = `random`

		this.buffering = false

		this.noData = false

		this.outputState = []
	}

	public serialize(): Serialized<ListenItem>
	{
		return {
			...this,
			endpoint: this.endpoint.toString(),
			remoteURL: this.remoteURL?.toString(),
			redirect: this.redirect?.toString(),
			connectedStreams: this.connectedStreams
				?.map( stream => ( { url: stream.url.toString(), id: stream.id } ) )
		}
	}

	public static serializePartial( data: Partial<ListenItem> ): Partial<Serialized<ListenItem>>
	{
		const _data: Partial<Serialized<ListenItem>> = {}

		for ( const key in data )
		{
			const k = key as keyof typeof data

			if ( [ `endpoint`, `redirect`, `remoteURL` ].includes( k ) )
			{
				const value = data[ k ]

				// TODO: fix any
				if ( value ) _data[ k ] = ( value.toString() as any )
				else _data[ k ] = undefined

				continue
			}

			if ( k === `connectedStreams` )
			{
				const value = data[ k ]

				if ( value ) _data[ k ] = value.map( stream =>
					( { url: stream.url.toString(), id: stream.id } ) )
				else _data[ k ] = []

				continue
			}
			
			// TODO: fix any
			_data[ k ] = ( data[ k ] as any )
		}
		
		return _data
	}

	public cloneSelf(): DataModelListenItem
	{
		return DataModelListenItem.clone( this )
	}

	public static clone( _item: ListenItem ): DataModelListenItem
	{
		return DataModelListenItem.fromSerialized( _item )
	}

	public static fromSerialized( data: ListenItem ): DataModelListenItem
	{
		const model = new DataModelListenItem( 
			new URL( data.endpoint.toString() ), 
			data.type )

		model.local = data.local

		model.label = data.label

		model.playing = data.playing

		model.listenMode = data.listenMode

		model.buffering = data.buffering

		model.noData = data.noData

		model.created = data.created
		
		model.remoteURL = data.remoteURL ? new URL( data.remoteURL.toString() ) : undefined
		
		model.redirect = data.redirect
			? new URL( data.redirect.toString() )
			: undefined

		for( const output of data.outputState )
		{
			model.outputState.push( output )
		}

		if ( data.connectedStreams )
		{
			model.connectedStreams = []
			
			for( const stream of data.connectedStreams )
			{
				model.connectedStreams.push( {
					url: new URL( stream.url.toString() ),
					id: stream.id
				} )
			}
		}

		return model
	}
}