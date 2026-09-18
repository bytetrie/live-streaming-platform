import { mount } from "redom"
import { APIGroup } from "./apiGroup"
import { APIRecording } from "./apiRecording"
import { DataCache } from "./dataCache"
import { DataCacheListenItem } from "./dataCacheListenItem"
import { DataCacheRecordingItem, DataCacheRecordingItemHandler } from "./dataCacheRecordingItem"
import { DataCacheSourceItem } from "./dataCacheSourceItem"
import { DataModelListenItem } from "./dataModelListenItem"
import { DataModelRecordingItem } from "./dataModelRecordingItem"
import { DataModelSourceItem } from "./dataModelSourceItem"
import { ErrorSystem } from "./errorSystem"
import { SyllidAdaptor } from "./listenAdaptor"
import { SplutterAdaptor } from "./recordingAdaptor"
import { RouterAdaptor } from "./routerAdaptor"
import { Route, RouterSystem, RouterSystemHandler } from "./routerSystem"
import { StateItems, Table } from "./stateItems"
import type { ListenState } from "./uiListenControls"
import { UIMetaHelper, UIMetaHelperHandler } from "./uiMetaHelper"
import { UIMetaRoot } from "./uiMetaRoot"
import { UIMetaViewManager, View } from "./uiMetaViewManager"
import { ViewEntitySystem } from "./viewEntitySystem"
import { ViewManagerHandler, ViewManagerNonRouteHandler } from "./viewManagerHandler"

enum LoadedState
{
	init = `init`,
	loading = `loading`,
	router = `router`,
	loaded = `loaded`,
	error = `error`
}

enum RecordingState
{
	notRecording = `Not recording`,
	recording = `Recording`
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

enum MonitorState
{
	notMonitoring = `Not monitoring`,
	monitoring = `Monitoring`
}

export class Synchromesh
implements
	UIMetaHelperHandler,
	ViewManagerNonRouteHandler,
	RouterSystemHandler,
	DataCacheRecordingItemHandler
{
	public onViewFirstLoad: ( view: View ) => void

	public onListenItemLabelChanged: ( label: string ) => void

	public onRecordingItemLabelChanged: ( label: string ) => void

	public onSourceItemLabelChanged: ( label: string ) => void

	private uiHelper: UIMetaHelper

	private root: UIMetaRoot

	private ui: UIMetaViewManager

	private uiHandler: ViewManagerHandler

	private router: RouterSystem

	private routerAdaptor: RouterAdaptor

	private itemState: StateItems

	private db?: DataCache

	private api: {
		recording: APIRecording
		group: APIGroup
		[type: string]: API
	}

	private errors: ErrorSystem

	private loaded: LoadedState

	private viewEntitySystem: ViewEntitySystem

	private recordingAdaptor: RecordingAdaptor

	private listenAdaptor: ListenAdaptor

	private recordingStateFn: Record<RecordingState, ( endpoint: URL ) => Promise<void>>

	constructor(
		rootSelector: string,
		private baseURL: URL,
		private publicSharePrefix: string,
		private adminSharePrefix: string,
		private groupSharePrefix: string,
		private useDB: boolean = true,
		mockAPI = false )
	{
		window.sychromesh = {}

		this.bindFns()

		this.onListenItemLabelChanged = label =>
			this.viewEntitySystem.onListenItemLabelChanged( label )
		
		this.onRecordingItemLabelChanged = label =>
			this.viewEntitySystem.onRecordingItemLabelChanged( label )

		this.onSourceItemLabelChanged = label =>
			this.viewEntitySystem.onSourceItemLabelChanged( label )

		this.errors = new ErrorSystem()

		this.loaded = LoadedState.init

		this.api = {
			recording: new APIRecording( {
				onRequestError: e => this.errors.error( e ),
			}, this.baseURL.toString() ),
			group: new APIGroup( {
				onRequestError: e => this.errors.error( e ),
			}, this.baseURL.toString() )
		}

		if ( mockAPI )
		{
			for( const api in this.api )
			{
				this.api[ api ].setMock( true )
			}
		}

		if ( this.useDB ) this.db = new DataCache()
		
		this.itemState = new StateItems(
			{
				onCacheError: error =>
				{
					this.errors.error( Error( `Error loading data from cache.` ) )

					this.errors.error( error )
				},
				onCacheLoaded: this.setDataLoaded
			},
			this.db )

		if ( this.db ) this.initDB()

		this.onViewFirstLoad = view => this.viewEntitySystem.init( view )

		this.router = new RouterSystem( this, this.baseURL )

		this.routerAdaptor = new RouterAdaptor(
			this.router,
			{
				onRouterAdaptorError: error => this.errors.error( error ),
				updateCurrentListenItem: this.loadListenItem,
				updateCurrentRecordingItem: this.loadRecordingItem,
				updateCurrentSourceItem: this.itemState.updateCurrentSourceItem,
				routerReady: () => this.loaded = LoadedState.router,
				onHandleAddGroup: this.addGroupItem
			},
			this.itemState )

		this.listenAdaptor = new SyllidAdaptor( {
			onLoadOutputs: () => this.viewEntitySystem.updateOutputs(),
			onError: error => this.errors.error( error )
		} )

		// TODO: handle segments
		this.recordingAdaptor = new SplutterAdaptor( {
			handleUploadForEndpoints: this.handleUploadForEndpoints,
			handleMappedFile: this.handleMappedFile,
			onError: error => this.errors.error( error ),
			onInputDeviceActivated: this.onInputDeviceActivated,
			onInputDeviceDeactivated: this.onInputDeviceDeactivated,
		} )

		this.uiHelper = new UIMetaHelper( this )

		this.uiHandler = new ViewManagerHandler( this.routerAdaptor, this )

		this.root = new UIMetaRoot( this.uiHelper, rootSelector )

		this.ui = new UIMetaViewManager( this.uiHelper, this.uiHandler )

		this.viewEntitySystem = new ViewEntitySystem(
			this.ui, this.router, this.routerAdaptor, this.listenAdaptor,
			{
				itemState: () => this.itemState
			},
			{
				onError: error => this.errors.error( error ),
				updateCurrentListenItem: this.loadListenItem
			},
			this.publicSharePrefix, this.groupSharePrefix, this.adminSharePrefix
		)

		this.ui.update( { setView: { view: View.loading } } )

		mount( this.root, this.ui )

		this.loaded = LoadedState.loading

		this.itemState.loadCache()

		this.recordingStateFn = {
			[ RecordingState.recording ]: ( endpoint: URL ) =>
				this.recordingAdaptor.endpointRecordingStart( endpoint ),
			[ RecordingState.notRecording ]: ( endpoint: URL ) =>
				this.recordingAdaptor.endpointRecordingStop( endpoint )
		}
	}
	
	private bindFns()
	{		
		this.requestCreateNewRecording = this.requestCreateNewRecording.bind( this )
		
		this.requestCreateRecordingEndpoint = this.requestCreateRecordingEndpoint.bind( this )
		
		this.requestRecordingStateChange = this.requestRecordingStateChange.bind( this )
		
		this.requestActivateInputDevice = this.requestActivateInputDevice.bind( this )
		
		this.requestChangeSelectedAudioInputSourceForRecording = this.requestChangeSelectedAudioInputSourceForRecording.bind( this )
		
		this.onMonitoringSourceItemStateChanged = this.onMonitoringSourceItemStateChanged.bind( this )
		
		this.requestCreateNewGroup = this.requestCreateNewGroup.bind( this )
		
		this.requestAddStreamToGroup = this.requestAddStreamToGroup.bind( this )
		
		this.requestRemoveStreamFromGroup = this.requestRemoveStreamFromGroup.bind( this )
		
		this.requestOutputStateChange = this.requestOutputStateChange.bind( this )
		
		this.requestListenStateChange = this.requestListenStateChange.bind( this )
		
		this.requestPlayingStateToggle = this.requestPlayingStateToggle.bind( this )

		this.setDataLoaded = this.setDataLoaded.bind( this )

		this.onRouterUpdate = this.onRouterUpdate.bind( this )

		this.onDataCacheTableError = this.onDataCacheTableError.bind( this )

		this.requestDeactivateInputDevice = this.requestDeactivateInputDevice.bind( this )

		this.onInputDeviceActivated = this.onInputDeviceActivated.bind( this )

		this.onInputDeviceDeactivated = this.onInputDeviceDeactivated.bind( this )

		this._requestChangeSelectedAudioInputSourceForRecording = this._requestChangeSelectedAudioInputSourceForRecording.bind( this )

		this.addGroupItem = this.addGroupItem.bind( this )

		this.loadListenItem = this.loadListenItem.bind( this )

		this.loadRecordingItem = this.loadRecordingItem.bind( this )
	}

	public static checkDB(): Promise<boolean>
	{
		return new Promise( resolve =>
		{
			try
			{
				const db = indexedDB.open( `PrivateBrowsingTest` )

				db.onerror = () => resolve( false )

				db.onsuccess = () => resolve( true )
			}
			catch
			{
				resolve( false )
			}
		} )
	}


	/**
	 * ----------------------
	 * 
	 * DATA
	 * 
	 * ----------------------
	 */

	private initDB()
	{
		const tables = [
			new DataCacheListenItem( Table.listenItems, this ),
			new DataCacheRecordingItem( Table.recordingItems, this ),
			new DataCacheSourceItem( Table.sourceItems, this ),
		]

		for ( const table of tables )
		{
			this.db?.addTable( table )
		}

		this.db?.setTables()
	}

	private setDataLoaded()
	{	
		if ( this.loaded !== LoadedState.loading )
		{
			this.errors.error( Error( `Tried to load already loaded app.` ) )

			return
		}		

		this.routerAdaptor.initRoutes()
	}

	public onDataCacheTableError( error: Error ): void
	{
		this.errors.error( error )
	}


	/**
	 * ----------------------
	 * 
	 * VIEW
	 * 
	 * ----------------------
	 */

	public onRouterUpdate( route: Route ): void
	{
		if ( this.loaded === LoadedState.loading )
		{
			return
		}
		else if ( this.loaded === LoadedState.router )
		{
			this.loaded = LoadedState.loaded
		}

		this.viewEntitySystem.update( this.routerAdaptor.routeMap[ route ].view )
	}


	/**
	 * -----------------------------
	 * 
	 * RECORDING EVENTS
	 * 
	 * -----------------------------
	 */


	/**
	 * Enables adding recordings directly from a URL
	 * 
	 * @param id ID for recording item
	 * @param url URL for recording item (in-app, not API)
	 */
	private loadRecordingItem( id: string, url: string ): Promise<void>
	{
		return new Promise( resolve =>
		{
			if ( !this.itemState.items.recording[ url ] )
			{
				const { adminURL } = this.api.recording.recordingURLsFromID( id )

				this.getRecordingItem( adminURL )
					.then( () =>
					{
						this.itemState.updateCurrentRecordingItem( url )

						resolve()
					} )
					.catch( () => this.routerAdaptor.gotoRecordingList() )
			}
			else
			{
				this.itemState.updateCurrentRecordingItem( url )

				resolve()
			}
		} )
	}

	private async getRecordingItem( url?: URL ): Promise<{recordingItem: RecordingItem, listenItem: ListenItem}>
	{
		const recordingData = await this.api.recording.getRecordingEndpoint( url )

		if ( !recordingData ) throw Error( `No data for endpoint` )

		const { adminURL, publicURL, listenURL, recordingURL } = recordingData

		const listenItem = new DataModelListenItem(
			listenURL, ListenItemType.mine, publicURL, false )

		this.itemState.add( Table.listenItems, listenItem )

		const requestingItem = new DataModelRecordingItem(
			recordingURL, listenURL, adminURL, true )

		this.itemState.add( Table.recordingItems, requestingItem )

		return { recordingItem: requestingItem, listenItem }
	}
	
	/**
	 * Creating a new recording creates a new "listen" item
	 * to go with it.
	 */
	public requestCreateNewRecording(): void
	{
		this.ui.update( { recordingListUpdate: { setAddRecordingState: true } } )

		this.getRecordingItem()
			.then( ( { listenItem, recordingItem } ) =>
			{
				this.routerAdaptor.routeMap[ Route.recordingItem ].goto( recordingItem.endpoint.toString() )

				this.ui.update( { 
					recordingListUpdate: {
						setAddRecordingState: false,
						item: {
							date: recordingItem.created,
							label: recordingItem.label,
							link: recordingItem.endpoint,
							state: recordingItem.state
						}
					},
					listenListUpdate: {
						item: {
							label: listenItem.label,
							link: listenItem.endpoint,
							playing: listenItem.playing,
							type: listenItem.type,
							created: listenItem.created
						}
					} } )
			} )
			.catch( () => 
			{
				this.ui.update( { recordingListUpdate: { setAddRecordingState: false } } )
			} )
	}
	
	/**
	 * TODO:
	 * 	- it might be better to handle this in a kind of
	 * 	messaging system
	 * 
	 * The "listen" item associated with the original recording item
	 * also needs to be migrated to be associated with the public URL
	 */
	public requestCreateRecordingEndpoint(): void
	{
		if ( !this.itemState.current.recording )
		{
			this.errors.error( Error( `No current recording item.` ) )

			this.routerAdaptor.gotoRecordingList()

			return
		}

		const oldRecording = DataModelRecordingItem.clone( this.itemState.current.recording )

		const oldListen = DataModelListenItem.clone( this.itemState.items.listen[ oldRecording.listen.toString() ] )

		const previousID = new URL( this.itemState.current.recording.endpoint.toString() )

		const previousListen = new URL( this.itemState.current.recording.listen.toString() )

		this.getRecordingItem()
			.then( ( { listenItem, recordingItem } ) =>
			{
				this.itemState.update( recordingItem.endpoint, Table.recordingItems, { 
					created: oldRecording.created,
					label: oldRecording.label,
					sourceID: oldRecording.sourceID,
					state: oldRecording.state } )

				this.itemState.update( listenItem.endpoint, Table.listenItems, {
					created: oldListen.created,
					label: oldListen.label,
					listenMode: oldListen.listenMode,
					type: oldListen.type
				} )

				this.itemState.update( previousID, Table.recordingItems, { redirect: recordingItem.endpoint } )

				this.itemState.update( previousListen, Table.listenItems, { redirect: listenItem.endpoint } )

				// TODO: move recording segments to new endpoint address
				// TODO: upload segments to endpoint
				// TODO: redirect to new listen page if current = old

				const currentRoute = this.router.current()

				if ( this.itemState.current.recording?.endpoint.toString() === previousID.toString()
					&& this.routerAdaptor.routeSet.recording.includes( currentRoute ) )
				{
					this.routerAdaptor.routeMap[ currentRoute ].goto( recordingItem.endpoint.toString() )
				}

				this.ui.update( { 
					recordingListUpdate: { 
						remove: previousID,
						item: {
							date: oldRecording.created,
							label: oldRecording.label,
							link: oldRecording.endpoint,
							state: oldRecording.state
						}
					},
					listenListUpdate: {
						remove: previousListen,
						item: {
							label: listenItem.label,
							link: listenItem.endpoint,
							playing: listenItem.playing,
							type: listenItem.type,
							created: listenItem.created
						}
					} } )
			} )
	}
	
	/**
	 * NOTE/TODO:
	 * 	- ensure redirect bare source item route to recording based
	 * 
	 * - get permission from user to access device
	 * - if cancel, show error
	 * - if success
	 * 	- create source items for channels
	 * 	- update source list ui
	 */
	public requestActivateInputDevice(): void
	{
		this.recordingAdaptor.inputDeviceActivate()
	}

	private onInputDeviceActivated( sources: string[] )
	{
		for( let i = 0; i < sources.length; i++ )
		{
			const item = new DataModelSourceItem( 
				this.router.getURLForRoute( { route: Route.sourceItemID, data: { id: sources[ i ] } } ),
				sources[ i ],
				i )

			this.itemState.add( Table.sourceItems, item )
			
			this.ui.update( { sourceListUpdate: { item: {
				label: item.label,
				link: item.endpoint
			},  } } )
		}

		this.ui.update( { sourceListUpdate: { audioDeviceActive: true } } )
	}

	/**
	 * - deactivate audio input
	 * - on return request success:
	 * 	- update recordings with device channel ids (set to empty?) 
	 * 	- change global input state
	 * 	- update source list UI
	 */
	public requestDeactivateInputDevice(): void
	{
		this.recordingAdaptor.inputDeviceDeactivate()
	}

	private onInputDeviceDeactivated( sources: string[] )
	{
		for( let i = 0; i < sources.length; i++ )
		{
			const key = this.itemState.sourceKey( sources[ i ] )

			const source = this.itemState.items.source[ key.toString() ]

			/**
			 * Update recording state for connected recording item UIs
			 */
			for( const rID of source.connectedRecordingIDs )
			{
				this.unsetSourceAndStateForRecording(
					this.itemState.items.recording[ rID.toString() ] )
			}

			this.itemState.remove( Table.sourceItems, key )
		}

		this.ui.update( { 
			sourceListUpdate: { audioDeviceActive: false, clearList: true } }
		)
	}

	private unsetSourceAndStateForRecording( recording: RecordingItem )
	{
		this.itemState.update( recording.endpoint, Table.recordingItems, { sourceID: undefined } )
		
		this.ui.update( {
			sourceListUpdate: { selected: `` },
			recordingListUpdate: {
				updateState: {
					link: recording.endpoint,
					state: RecordingState.notRecording
				}
			},
			recordingItemUpdate: {
				id: recording.endpoint.toString(),
				data: {
					updateRecordingState: {
						hasSource: false,
						recordingState: RecordingState.notRecording,
						volume: 0
					}
				}
			}
		} )
	}
	
	/**
	 * - send request to change input source (deactivate/reactivate?)
	 * 	- change global recording state (connected sources)
	 * 	- update recording item UI(s?)
	 * 	- update source item ui (connected)
	 * 	- update source list
	 */
	public requestChangeSelectedAudioInputSourceForRecording( sourceItemID: URL ): void
	{
		const { recording } = this.itemState.current

		if ( !recording )
		{
			this.errors.error( Error( `No current recording item.` ) )

			this.routerAdaptor.gotoRecordingList()

			return
		}

		const endpoint = recording.endpoint.toString()

		const { sourceID: source } = recording

		if ( !source )
		{
			this._requestChangeSelectedAudioInputSourceForRecording( sourceItemID, recording, endpoint )
		}
		else
		{
			const sourceID = source.toString()

			const { 
				refID,
				connectedRecordingIDs
			} = this.itemState.items.source[ sourceID ]

			// remove current connection
			this.recordingAdaptor.endpointForSourceRemove(
				refID, 
				recording.endpoint )
				.then( () =>
				{
					this.itemState.update( source, Table.sourceItems, {
						connectedRecordingIDs: connectedRecordingIDs.filter( url => url.toString() !== endpoint )
					} )
		
					this.unsetSourceAndStateForRecording( recording )

					this._requestChangeSelectedAudioInputSourceForRecording( sourceItemID, recording, endpoint )
				} )
				.catch( error => this.errors.error( error ) )
		}
	}

	private _requestChangeSelectedAudioInputSourceForRecording( sourceItemID: URL, recording: RecordingItem, endpoint: string )
	{
		const { 
			refID,
			connectedRecordingIDs
		} = this.itemState.items.source[ sourceItemID.toString() ]

		this.recordingAdaptor.endpointForSourceAdd(
			refID, 
			recording.endpoint,
			recording.remoteURL )
			.then( () =>
			{
				connectedRecordingIDs.push( recording.endpoint )

				this.itemState.update( sourceItemID, Table.sourceItems, {
					connectedRecordingIDs
				} )

				this.itemState.update( recording.endpoint, Table.recordingItems, { sourceID: sourceItemID } )

				this.ui.update( {
					sourceListUpdate: { selected: sourceItemID },
					recordingItemUpdate: {
						id: endpoint,
						data: { updateRecordingState: { hasSource: true } } } } )
			} )
			.catch( error => this.errors.error( error ) )
	}
	
	public requestRecordingStateChange( state: RecordingState ): void
	{
		const id = this.itemState.current.recording?.endpoint

		if ( !id )
		{
			this.errors.error( Error( `No current recording item.` ) )

			this.routerAdaptor.gotoRecordingList()

			return
		}

		this.recordingStateFn[ state ]( id )
			.then( () =>
			{
				this.itemState.update( id, Table.recordingItems, { state } )
				
				this.ui.update( { 
					recordingListUpdate: { updateState: { link: id, state } },
					recordingItemUpdate: { 
						id: id.toString(), 
						data: { updateRecordingState: { recordingState: state } } } } )
			} )
			.catch( error => this.errors.error( error ) )
	}
	
	/**
	 * - request send input channel data to first output channel
	 * - update source item UI
	 */
	public onMonitoringSourceItemStateChanged( state: MonitorState ): void
	{
		const { source } = this.itemState.current

		if ( !source )
		{
			this.errors.error( Error( `Could not load data` ) )

			this.routerAdaptor.gotoSourceList()

			return
		}

		if ( state === MonitorState.monitoring )
		{
			this.recordingAdaptor.monitorSourceStart( source.refID )
		}
		else
		{
			this.recordingAdaptor.monitorSourceEnd( source.refID )
		}

		this.ui.update( { sourceItemUpdate: { 
			id: source.endpoint.toString(), 
			data: { monitorState: state } } } )
	}

	/**
	 * -----------------------------
	 * 
	 * SEGMENT DATA
	 * 
	 * -----------------------------
	 */

	private handleUploadForEndpoints( file: File, endpoints: URL[] )
	{
		// TODO: add file to cache for internal items
		// incr file id
		// console.log( `got file for endpoints` )
	}

	private handleMappedFile( file: File, urls: string[] )
	{
		// TODO: add file to cache for url ref
		// console.log( `got mapping for file` )
	}


	/**
	 * -----------------------------
	 * 
	 * LISTEN EVENTS
	 * 
	 * -----------------------------
	 */

	/**
	 * Enables adding streams directly from a URL
	 * 
	 * @param id ID for listen item
	 * @param url URL for listen item (in-app, not API)
	 */
	private loadListenItem( id: string, url: string )
	{
		if ( !this.itemState.items.listen[ url ] )
		{
			const { listenURL, publicURL } = this.api.recording.listenURLsFromID( id )

			const listenItem = new DataModelListenItem(
				listenURL, ListenItemType.shared, publicURL, false
			)

			this.itemState.add( Table.listenItems, listenItem )
		
			this.ui.update( {
				listenListUpdate: { item: {
					label: listenItem.label,
					link: listenURL,
					playing: listenItem.playing,
					type: listenItem.type,
					created: listenItem.created
				} } } )
		}

		this.itemState.updateCurrentListenItem( url )
	}


	/**
	 * - request group item from server
	 * - on success:
	 * 	- add group data as new group item
	 * 	- update listen list UI
	 * 	- redirect to new group item
	 */
	public requestCreateNewGroup(): void
	{
		this.api.group.getGroup().then( ( { url, id } ) => this.addGroupItem( url, id ) )
	}

	private addGroupItem( groupURL: URL, groupID: string ): void
	{
		const streamURL = this.router.getURLForRoute( { 
			route: Route.listenItem, data: { id: groupID } } )

		const _url = streamURL.toString()
	
		/**
		 * Adding check for existing group, if exists, just redirect
		 * Otherwise, create the new item, then redirect
		 */
		if ( !this.itemState.items.listen[ _url ] )
		{
			const item = new DataModelListenItem(
				streamURL,
				ListenItemType.group,
				groupURL )
	
			this.itemState.add( Table.listenItems, item )
	
			this.ui.update( { listenListUpdate: { item: {
				label: item.label,
				link: item.endpoint,
				playing: item.playing,
				type: item.type,
				created: item.created
			} } } )	
		}

		this.routerAdaptor.gotoListenItem( _url )
	}
	
	/**
	 * NOTE: only streams with public endpoints can be added
	 * 
	 * TODO:
	 * - request adding stream to group
	 * - on success:
	 * 	- update group streams data
	 * 	- update list item label
	 * 	- enable fetching of added stream data
	 */
	public requestAddStreamToGroup( stream: URL ): void
	{
		// get current group
		const { listen: group } = this.itemState.current

		// get stream api url from state 
		const { remoteURL } = this.itemState.items.listen[ stream.toString() ]

		if ( !group || !remoteURL || !group.remoteURL )
		{
			this.errors.error( Error( `Can't add stream.` ) )

			this.routerAdaptor.gotoListenList()

			return
		}

		const url = new URL( remoteURL.toString() )

		url.searchParams.set( `start`, `random` )

		this.api.group.addStream( url, group.remoteURL )
			.then( ( { id } ) => 
			{
				const streams = this.itemState.items.listen[ group.endpoint.toString() ].connectedStreams ?? []

				streams.push( {
					url: stream,
					id
				} )

				this.itemState.update( group.endpoint, Table.listenItems, { connectedStreams: streams } )

				this.ui.update( { groupAddUpdate: { added: stream.toString() } } )
			} )
	}
	
	/**
	 * NOTE: only streams with an id can be removed
	 * 
	 * TODO:
	 * - request remove stream from group
	 * - on success:
	 * 	- update group streams data
	 * 	- update list item label
	 * 	- stop fetching of removed stream data
	 */
	public requestRemoveStreamFromGroup( group: URL, stream: URL ): void
	{
		const _groupURL = group.toString()

		const _group = this.itemState.items.listen[ _groupURL ]

		const _stream = stream.toString()

		const connection = _group.connectedStreams?.find( ( { url } ) => url.toString() === _stream )

		if ( !connection || !connection.id || !_group.remoteURL )
		{
			this.errors.error( Error( `Stream can't be removed.` ) )

			return
		}

		this.api.group.removeStream( connection.id, _group.remoteURL )
			.then( () => 
			{
				const streams = this.itemState.items.listen[ _groupURL ].connectedStreams
					?.filter( s => s.id !== connection.id )

				this.itemState.update( group, Table.listenItems, { connectedStreams: streams } )

				this.ui.update( { groupEditUpdate: { removed: _stream } } )
			} )
	}
	
	/**
	 * TODO:
	 * - change outputting state on channel
	 * - update listen item data
	 * - update listen ui
	 */
	public requestOutputStateChange( id: string, state: OutputState ): void
	{
		if ( state === OutputState.active )
		{
			this.listenAdaptor.activateOutput( id )
		}
		else
		{
			this.listenAdaptor.muteOutput( id )
		}

		const { listen } = this.itemState.current

		if ( !listen ) return

		this.ui.update( {
			listenItemUpdate: {
				id: listen.endpoint.toString(),
				data: { outputState: { id, state } } } } )
	}
	
	public requestListenStateChange( state: ListenState ): void
	{
		/**
		 * TODO:
		 * - change listen mode -> noData, buffering, playing
		 * - update listen item data
		 * - update listen ui
		 * - (listen list label?)
		 */
	}
	
	/**
	 * TODO:
	 * - change playing state of stream source, connection to output channels, 
	 * - update listen item data
	 * - update listen item ui
	 * - (listen list label?)
	 */
	public requestPlayingStateToggle(): void
	{
		const { listen } = this.itemState.current

		if ( !listen || !listen.endpoint || !listen.remoteURL )
		{
			this.errors.error( Error( `No current stream item.` ) )

			this.routerAdaptor.gotoListenList()

			return
		}

		this.listenAdaptor.toggleURL( listen.remoteURL )
			.then( playing =>
			{
				const id = listen.endpoint

				this.ui.update( { 
					listenItemUpdate: {
						id: id.toString(),
						data: { updateControls: { playing } } },
					listenListUpdate: {
						updatePlaying: { link: id, playing }
					} } )

				this.itemState.update( id, Table.listenItems, { playing } )
			} )
	}


	/**
	 * -----------------------------
	 * 
	 * STYLE EVENTS
	 * 
	 * -----------------------------
	 */
	
	public onUpdateStyleVars(): void
	{
		//
	}
}