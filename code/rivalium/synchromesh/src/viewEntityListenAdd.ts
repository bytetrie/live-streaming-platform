import { ListenItemType, UIMetaViewManager, View } from "./uiMetaViewManager"
import type { UIGroupAddItem } from "./uiViewGroupAddStreams"
import type { ViewEntity } from "./viewManagerHandler"

export interface ViewEntityListenAddHandler
{
	gotoListenList: () => void

	/**
	 * If current route doesn't match current listen item
	 */
	updateCurrentListenItem: () => void

	onError: ( error: string | Error | ErrorEvent ) => void
}

export interface ViewEntityListenAddProvider
{
	currentListenItem: () => ListenItem | undefined

	listenItems: () => Record<string, ListenItem>

	navigationURL: () => URL
}

export class ViewEntityListenAdd implements ViewEntity
{
	public view: View.listenAdd

	constructor(
		public ui: UIMetaViewManager,
		public route: string,
		private provider: ViewEntityListenAddProvider,
		private handler: ViewEntityListenAddHandler )
	{
		this.onRouteUpdate = this.onRouteUpdate.bind( this )

		this.onFirstLoad = this.onFirstLoad.bind( this )

		this.view = View.listenAdd
	}

	private checkCurrent(): ListenItem | undefined
	{
		const item = this.provider.currentListenItem()

		if ( !item )
		{
			this.handler.onError( Error( `Could not load data` ) )

			this.handler.gotoListenList()

			return
		}

		return item
	}

	public onRouteUpdate(): void
	{
		let item = this.checkCurrent()

		if ( !item ) return

		const navigationURL = this.provider.navigationURL()

		if ( navigationURL.toString() !== item.endpoint.toString() )
		{
			this.handler.updateCurrentListenItem()

			item = this.checkCurrent()

			if ( !item ) return
		}

		const items: UIGroupAddItem[] = []

		const connected = item.connectedStreams?.map( i => i.url.toString() ) ?? []

		// Items need to be:
		// - not local
		// - not added
		for ( const id in this.provider.listenItems() )
		{
			const item = this.provider.listenItems()[ id ]

			if ( item.local 
				|| item.type === ListenItemType.group 
				|| connected.includes( item.endpoint.toString() ) )
			{
				continue
			}

			items.push( {
				label: item.label,
				created: item.created,
				link: item.endpoint,
				type: item.type
			} )
		}

		const setView = {
			view: this.view, 
			navigationURL,
			id: item.endpoint.toString(),
			items
		}

		this.ui.update( { setView } )
		// provided data each load
	}

	public onFirstLoad(): void
	{
		//
	}
}