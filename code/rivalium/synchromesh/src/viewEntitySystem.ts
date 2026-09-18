import type { RouterAdaptor } from "./routerAdaptor"
import { Route, RouterSystem } from "./routerSystem"
import { StateItems, Table } from "./stateItems"
import { UIMetaViewManager, View } from "./uiMetaViewManager"
import { ViewEntityListenAdd } from "./viewEntityListenAdd"
import { ViewEntityListenEdit } from "./viewEntityListenEdit"
import { ViewEntityListenItem } from "./viewEntityListenItem"
import { ViewEntityListenList } from "./viewEntityListenList"
import { ViewEntityRecordingItem } from "./viewEntityRecordingItem"
import { ViewEntityRecordingList } from "./viewEntityRecordingList"
import { ViewEntitySourceItem } from "./viewEntitySourceItem"
import { ViewEntitySourceList } from "./viewEntitySourceList"
import type { ViewEvents } from "./viewManagerHandler"

export interface ViewEntitySystemProvider
{
	itemState: () => StateItems
}

export interface ViewEntitySystemHandler
{
	updateCurrentListenItem: ( id: string, itemURL: string ) => void

	onError: ( error: string | Error | ErrorEvent ) => void
}

export class ViewEntitySystem
{
	private listenAdd: ViewEntityListenAdd

	private listenEdit: ViewEntityListenEdit

	private listenItem: ViewEntityListenItem

	private listenList: ViewEntityListenList

	private recordingItem: ViewEntityRecordingItem

	private recordingList: ViewEntityRecordingList

	private sourceItem: ViewEntitySourceItem

	private sourceList: ViewEntitySourceList

	private viewEvents: Record<View, ViewEvents>

	constructor(
		private ui: UIMetaViewManager,
		private router: RouterSystem,
		private routerAdaptor: RouterAdaptor,
		private listenAdaptor: ListenAdaptor,
		private provider: ViewEntitySystemProvider,
		private handler: ViewEntitySystemHandler,
		publicSharePrefix: string,
		groupSharePrefix: string,
		adminSharePrefix: string
	)
	{
		this.bindFns()

		this.listenAdd = new ViewEntityListenAdd(
			this.ui, 
			Route.listenAdd,
			{
				navigationURL: () => this.listNavURL( Route.listenAdd ),
				currentListenItem: () => this.provider.itemState().current.listen,
				listenItems: () => this.provider.itemState().items.listen
			},
			{
				gotoListenList: () => this.routerAdaptor.gotoListenList(),
				updateCurrentListenItem: () => this.updateCurrentListenItem(),
				onError: error => this.handler.onError( error )
			}
		)

		this.listenEdit = new ViewEntityListenEdit(
			this.ui, 
			Route.listenEdit,
			{
				navigationURL: () => this.listNavURL( Route.listenEdit ),
				currentListenItem: () => this.provider.itemState().current.listen,
				listenItems: () => this.provider.itemState().items.listen
			},
			{
				gotoListenList: () => this.routerAdaptor.gotoListenList(),
				updateCurrentListenItem: () => this.updateCurrentListenItem(),
				onError: error => this.handler.onError( error )
			}
		)

		this.listenItem = new ViewEntityListenItem(
			this.ui, 
			Route.listenItem,
			publicSharePrefix,
			groupSharePrefix,
			this.listenAdaptor,
			{
				navigationURL: () => this.listNavURL( Route.listenItem ),
				currentListenItem: () => this.provider.itemState().current.listen,
				listenItems: () => this.provider.itemState().items.listen,
				idFromURL: url => this.getIDFromURL( url ),
				getRecordingEndpointForItem: _url =>
				{
					const url = _url.toString()
 
					const { recording } = this.provider.itemState().items

					for ( const item in this.provider.itemState().items.recording )
					{
						if ( recording[ item ].listen.toString() === url )
							return recording[ item ].endpoint.toString()
					}
				}
			},
			{
				gotoListenList: () => this.routerAdaptor.gotoListenList(),
				updateListenItem: ( id, data ) =>
					this.provider.itemState().update( id, Table.listenItems, data ),
				onError: error => this.handler.onError( error )
			}
		)

		this.listenList = new ViewEntityListenList(
			this.ui, 
			Route.listenList,
			{
				navigationURL: () => this.listNavURL( Route.listenList ),
				listenItems: () => this.provider.itemState().items.listen
			}
		)

		this.recordingItem = new ViewEntityRecordingItem(
			this.ui,
			Route.recordingItem,
			{
				navigationURL: () => this.listNavURL( Route.recordingItem ),
				currentRecordingItem: () => this.provider.itemState().current.recording,
				listenItems: () => this.provider.itemState().items.listen,
				idFromURL: url => this.getIDFromURL( url )
			},
			{
				gotoRecordingList: () => this.routerAdaptor.gotoRecordingList(),
				updateRecordingItem: ( id, data ) =>
					this.provider.itemState().update( id, Table.recordingItems, data ),
				onError: error => this.handler.onError( error )
			},
			adminSharePrefix,
			publicSharePrefix
		)

		this.recordingList = new ViewEntityRecordingList(
			this.ui, 
			Route.recordingList,
			{
				navigationURL: () => this.listNavURL( Route.recordingList ),
				recordingItems: () => this.provider.itemState().items.recording
			}
		)

		this.sourceItem = new ViewEntitySourceItem(
			this.ui, 
			Route.sourceItem,
			{
				navigationURL: () => this.listNavURL( Route.sourceItem ),
				currentSourceItem: () => this.provider.itemState().current.source,
				sourceItems: () => this.provider.itemState().items.source
			},
			{
				gotoRecordingList: () => this.routerAdaptor.gotoRecordingList(),
				updateSourceItem: ( id, data ) =>
					this.provider.itemState().update( id, Table.sourceItems, data ),
				onError: error => this.handler.onError( error )
			}
		)

		this.sourceList = new ViewEntitySourceList(
			this.ui, 
			Route.sourceList,
			{
				navigationURL: () => this.listNavURL( Route.sourceList ),
				sourceItems: () => this.provider.itemState().items.source,
				currentRecordingItem: () => this.provider.itemState().current.recording
			},
			{
				gotoRecordingList: () => this.routerAdaptor.gotoRecordingList(),
				onError: error => this.handler.onError( error )
			}
		)

		this.viewEvents = {
			[ View.recordingList ]: this.recordingList,
			[ View.listenList ]: this.listenList,
			[ View.sourceList ]: this.sourceList,
			[ View.recordingItem ]: this.recordingItem,
			[ View.listenItem ]: this.listenItem,
			[ View.sourceItem ]: this.sourceItem,
			[ View.listenAdd ]: this.listenAdd,
			[ View.listenEdit ]: this.listenEdit,
			[ View.loading ]: {
				onRouteUpdate: () => void {},
				onFirstLoad: () => void {}
			}
		}
	}

	private bindFns()
	{
		this.updateCurrentListenItem = this.updateCurrentListenItem.bind( this )

		this.listNavURL = this.listNavURL.bind( this )

		this.init = this.init.bind( this )

		this.update = this.update.bind( this )

		this.onListenItemLabelChanged = this.onListenItemLabelChanged.bind( this )
		
		this.onRecordingItemLabelChanged = this.onRecordingItemLabelChanged.bind( this )

		this.getIDFromURL = this.getIDFromURL.bind( this )
	}

	private getIDFromURL( url: URL )
	{
		const data = this.router.dataFromURL( url.toString() )

		return ( `data` in data && `id` in data.data )
			? data.data.id
			: ``
	}

	private updateCurrentListenItem()
	{
		const routeData = this.router.dataFromURL( window.location.href )

		const id = `data` in routeData && `id` in routeData.data
			? routeData.data.id
			: ``

		if ( !id ) throw Error( `No stream ID in route` )

		const itemURL = this.router.getURLForRoute( { route: Route.listenItem, data: { id } } ).toString()

		this.handler.updateCurrentListenItem( id, itemURL )
	}

	private listNavURL( route: Route )
	{
		return this.router.getURLForRoute( this.routerAdaptor.routeMap[ route ].navigation() )
	}

	public updateOutputs(): void
	{
		if ( this.router.current() === Route.listenItem )
			this.listenItem.updateOutputs()
	}

	public onListenItemLabelChanged( label: string ): void
	{
		this.listenItem.onListenItemLabelChanged( label )
	}

	public onRecordingItemLabelChanged( label: string ): void
	{
		this.recordingItem.onRecordingItemLabelChanged( label )
	}

	public onSourceItemLabelChanged( label: string ): void
	{
		this.sourceItem.onSourceItemLabelChanged( label )
	}
	
	public init( view: View ): void
	{
		this.viewEvents[ view ].onFirstLoad()
	}

	public update( view: View ): void
	{
		this.viewEvents[ view ].onRouteUpdate()
	}
}