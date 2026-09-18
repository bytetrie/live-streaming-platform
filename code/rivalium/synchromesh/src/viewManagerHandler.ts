import type { RouterAdaptor } from "./routerAdaptor"
import type { ListenState } from "./uiListenControls"
import type { UIMetaViewManager, UIMetaViewManagerHandler, View } from "./uiMetaViewManager"

enum RecordingState
{
	notRecording = `Not recording`,
	recording = `Recording`
}

enum OutputState
{
	muted = `Muted`,
	active = `Active`
}

enum MonitorState
{
	notMonitoring = `Not monitoring`,
	monitoring = `Monitoring`
}

export interface ViewEvents
{
	onRouteUpdate: () => void
	onFirstLoad: () => void
}

export interface ViewEntity extends ViewEvents
{
	view: View
	ui: UIMetaViewManager
	route: string
}

export interface ViewManagerNonRouteHandler
{
	onViewFirstLoad: ( view: View ) => void

	requestCreateNewGroup: () => void

	requestAddStreamToGroup: ( stream: URL ) => void

	requestRemoveStreamFromGroup: ( group: URL, stream: URL ) => void

	requestCreateNewRecording: () => void

	requestActivateInputDevice: () => void

	requestDeactivateInputDevice: () => void

	requestChangeSelectedAudioInputSourceForRecording: ( link: URL ) => void

	onListenItemLabelChanged: ( label: string ) => void

	requestOutputStateChange: ( id: string, state: OutputState ) => void

	requestListenStateChange: ( state: ListenState ) => void

	requestPlayingStateToggle: () => void

	requestCreateRecordingEndpoint: () => void

	onRecordingItemLabelChanged: ( label: string ) => void

	requestRecordingStateChange: ( state: RecordingState ) => void

	onSourceItemLabelChanged: ( label: string ) => void

	onMonitoringSourceItemStateChanged: ( state: MonitorState ) => void
}

export class ViewManagerHandler implements UIMetaViewManagerHandler
{
	public gotoAddStreamsToGroup?: ( ( linkHREF: string ) => void ) | undefined

	public gotoEditStreamsForGroup?: ( ( linkHREF: string ) => void ) | undefined

	public gotoRecordingList: ( linkHREF: string ) => void

	public gotoListenItem: ( linkHREF: string ) => void

	public gotoGroup: ( linkHREF: string ) => void

	public gotoListenList: ( linkHREF: string ) => void

	public gotoRecordingItem: ( linkHREF: string ) => void

	public gotoSourceItem: ( linkHREF: string ) => void

	public gotoManageAudioSource: () => void

	public gotoSourceList: ( linkHREF: string ) => void

	public onViewFirstLoad: ( view: View ) => void

	public requestCreateNewGroup: () => void

	public requestAddStreamToGroup: ( stream: URL ) => void

	public requestRemoveStreamFromGroup: ( group: URL, stream: URL ) => void

	public requestCreateNewRecording: () => void

	public requestActivateInputDevice: () => void

	public requestDeactivateInputDevice: () => void

	public requestChangeSelectedAudioInputSourceForRecording: ( link: URL ) => void

	public onListenItemLabelChanged: ( label: string ) => void

	public requestOutputStateChange: ( id: string, state: OutputState ) => void

	public requestListenStateChange: ( state: ListenState ) => void

	public requestPlayingStateToggle: () => void

	public requestCreateRecordingEndpoint: () => void

	public onRecordingItemLabelChanged: ( label: string ) => void

	public requestRecordingStateChange: ( state: RecordingState ) => void

	public onSourceItemLabelChanged: ( label: string ) => void

	public onMonitoringSourceItemStateChanged: ( state: MonitorState ) => void

	constructor( private routerAdaptor: RouterAdaptor, private rest: ViewManagerNonRouteHandler )
	{
		this.gotoGroup = this.routerAdaptor.gotoGroup

		this.gotoRecordingList = this.routerAdaptor.gotoRecordingList

		this.gotoListenItem = this.routerAdaptor.gotoListenItem

		this.gotoListenList = this.routerAdaptor.gotoListenList

		this.gotoRecordingItem = this.routerAdaptor.gotoRecordingItem

		this.gotoSourceItem = this.routerAdaptor.gotoSourceItem

		this.gotoAddStreamsToGroup = this.routerAdaptor.gotoAddStreamsToGroup

		this.gotoEditStreamsForGroup = this.routerAdaptor.gotoEditStreamsForGroup

		this.gotoManageAudioSource = this.routerAdaptor.gotoSourceList

		this.gotoSourceList = this.routerAdaptor.gotoSourceList

		this.onViewFirstLoad = this.rest.onViewFirstLoad

		this.requestCreateNewGroup = this.rest.requestCreateNewGroup

		this.requestAddStreamToGroup = this.rest.requestAddStreamToGroup

		this.requestRemoveStreamFromGroup = this.rest.requestRemoveStreamFromGroup

		this.requestCreateNewRecording = this.rest.requestCreateNewRecording

		this.requestActivateInputDevice = this.rest.requestActivateInputDevice

		this.requestDeactivateInputDevice = this.rest.requestDeactivateInputDevice

		this.requestChangeSelectedAudioInputSourceForRecording = this.rest.requestChangeSelectedAudioInputSourceForRecording

		this.onListenItemLabelChanged = this.rest.onListenItemLabelChanged

		this.requestOutputStateChange = this.rest.requestOutputStateChange

		this.requestListenStateChange = this.rest.requestListenStateChange

		this.requestPlayingStateToggle = this.rest.requestPlayingStateToggle

		this.requestCreateRecordingEndpoint = this.rest.requestCreateRecordingEndpoint

		this.onRecordingItemLabelChanged = this.rest.onRecordingItemLabelChanged

		this.requestRecordingStateChange = this.rest.requestRecordingStateChange

		this.onSourceItemLabelChanged = this.rest.onSourceItemLabelChanged

		this.onMonitoringSourceItemStateChanged = this.rest.onMonitoringSourceItemStateChanged
	}
}