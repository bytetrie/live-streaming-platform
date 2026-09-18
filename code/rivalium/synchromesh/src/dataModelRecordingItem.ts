enum RecordingState
{
	notRecording = `Not recording`,
	recording = `Recording`
}

export class DataModelRecordingItem implements RecordingItem
{
	public created: Date

	public label: string

	public state: RecordingState

	public sourceID?: URL

	public redirect?: URL

	constructor( 
		public endpoint: URL,
		public listen: URL,
		public remoteURL?: URL,
		public local: boolean = false )
	{
		this.created = new Date()

		this.label = `New recording from ${( this.created ).toLocaleString()}`

		this.state = RecordingState.notRecording
	}

	public serialize(): Serialized<RecordingItem>
	{
		return {
			...this,
			endpoint: this.endpoint.toString(),
			remoteURL: this.remoteURL?.toString(),
			listen: this.listen.toString(),
			sourceID: this.sourceID?.toString(),
			redirect: this.redirect?.toString()
		}
	}

	public static serializePartial( data: Partial<RecordingItem> ): Partial<Serialized<RecordingItem>>
	{
		const _data: Partial<Serialized<RecordingItem>> = {}

		for ( const key in data )
		{
			const k = key as keyof typeof data

			if ( [ `endpoint`, `listen`, `sourceID`, `redirect`, `remoteURL` ].includes( k ) )
			{
				const value = data[ k ]

				// TODO: fix any
				if ( value ) _data[ k ] = ( value.toString() as any )
				else _data[ k ] = undefined

				continue
			}
			
			// TODO: fix any
			_data[ k ] = ( data[ k ] as any )
		}
		
		return _data
	}

	public cloneSelf(): DataModelRecordingItem
	{
		return DataModelRecordingItem.clone( this )
	}

	public static clone( _item: RecordingItem ): DataModelRecordingItem
	{
		return DataModelRecordingItem.fromSerialized( _item )
	}

	public static fromSerialized( data: RecordingItem ): DataModelRecordingItem
	{
		const model = new DataModelRecordingItem( 
			new URL( data.endpoint.toString() ),
			new URL( data.listen.toString() ) )

		model.local = data.local

		model.label = data.label

		model.created = data.created

		model.state = data.state

		model.sourceID = data.sourceID ? new URL( data.sourceID.toString() ) : undefined
		
		model.redirect = data.redirect ? new URL( data.redirect.toString() ) : undefined
		
		model.remoteURL = data.remoteURL ? new URL( data.remoteURL.toString() ) : undefined

		return model
	}
}