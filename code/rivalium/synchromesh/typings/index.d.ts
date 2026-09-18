declare module UI
{
	import type { Styles } from "jss";

	interface Styled<T>
	{
		id: string
		
		classes?: Record<T, string>
		
		styles: () => Partial<Styles<T>>

		styleVars?: () => Record<T, string>
	}
}

declare module Cache
{
	import type Dexie from "dexie"

	interface CacheTable
	{
		name: string
		columns: string
		table?: Dexie.Table<T, string>
		setTable: (cache: Dexie) => void
		load: () => Promise<T[]>
		add: (item: T) => void
		update: ( id: URL, item: Partial<T> ) => void
		remove: ( id: URL ) => void
	}
}

enum RecordingState
{
	notRecording = `Not recording`,
	recording = `Recording`
}

interface RecordingItem
{
	label: string
	endpoint: URL
	remoteURL?: URL
	created: Date
	state: RecordingState
	listen: URL
	local: boolean
	sourceID?: URL
	redirect?: URL
}

interface RecordingItemSerialized extends RecordingItem
{
	endpoint: string
	created: Date
	listen: string
	sourceID?: string
	redirect?: string
}

interface GroupStream
{
	url: URL
	id?: string
}

interface GroupStreamSerialized
{
	url: string
	id?: string
}

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

interface ListenItem
{
	label: string
	endpoint: URL
	remoteURL?: URL
	created: Date
	playing: boolean
	listenMode: `live` | `progress` | `random`
	buffering: boolean
	noData: boolean
	type: ListenItemType
	outputState: OutputState[]
	connectedStreams?: GroupStream[]
	local: boolean
	redirect?: URL
}

interface ListenItemSerialized extends ListenItem
{
	endpoint: string
	redirect?: string
	connectedStreams?: GroupStreamSerialized[]
}

enum MonitorState
{
	notMonitoring = `Not monitoring`,
	monitoring = `Monitoring`
}

interface SourceItem
{
	label: string
	endpoint: URL
	monitoringState: MonitorState
	connectedRecordingIDs: URL[]
	refID: string
}

interface SourceItemSerialized extends SourceItem
{
	endpoint: string
	connectedRecordingIDs: string[]
}

type Serialized<T> = 
	T extends ListenItem ? ListenItemSerialized :
	T extends SourceItem ? SourceItemSerialized :
	T extends RecordingItem ? RecordingItemSerialized :
	T; 

interface Window 
{
	sychromesh: {
		errors?: {
			getLast?: (amount: number) => void
		}
	}
}

interface API
{
	setMock: ( mock: boolean ) => void
}


interface RecordingAdaptor
{
	inputDeviceActivate(): void
	inputDeviceDeactivate(): void

	// Internal indicates URL isn't to be used by uploader but
	// is to be returned when file is emitted by recording api
	endpointForSourceAdd( sourceID: string, endpoint: URL, remoteURL?: URL ): Promise<void>
	endpointForSourceRemove( sourceID: string, endpoint: URL ): Promise<void>
	
	monitorSourceStart( sourceID: string ): void
	monitorSourceEnd( sourceID: string ): void

	endpointRecordingStart(endpoint: URL): Promise<void>
	endpointRecordingStop(endpoint: URL): Promise<void>
}

interface OutputItem
{
	id: string
	label: string
	state: OutputState
}

interface ListenAdaptor
{
	outputs(): OutputItem[]

	activateOutput( id: string ): Promise<this>
	muteOutput( id: string ): Promise<this>

	playURL( url: URL ): Promise<this>
	stopURL( url: URL ): Promise<this>
	toggleURL( url: URL ): Promise<boolean>
}