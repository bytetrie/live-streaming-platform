import { UIMetaViewManager, View } from "./uiMetaViewManager"
import type { UIGroupEditItem } from "./uiViewGroupEditStreams"
import type { ViewEntity } from "./viewManagerHandler"

export interface ViewEntityListenEditHandler
{
	gotoListenList: () => void

	/**
	 * If current route doesn't match current listen item
	 */
	updateCurrentListenItem: () => void

	onError: ( error: string | Error | ErrorEvent ) => void
}

export interface ViewEntityListenEditProvider
{
	currentListenItem: () => ListenItem | undefined

	listenItems: () => Record<string, ListenItem>

	navigationURL: () => URL
}

export class ViewEntityListenEdit implements ViewEntity
{
	public view: View.listenEdit

	constructor(
		public ui: UIMetaViewManager,
		public route: string,
		private provider: ViewEntityListenEditProvider,
		private handler: ViewEntityListenEditHandler )
	{
		this.onRouteUpdate = this.onRouteUpdate.bind( this )

		this.onFirstLoad = this.onFirstLoad.bind( this )

		this.view = View.listenEdit
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

		const items: UIGroupEditItem[] = []

		const connected = item.connectedStreams?.map( i => i.url.toString() ) ?? []

		// Items need to be:
		// - not local
		// - not added
		for ( const id in this.provider.listenItems() )
		{
			const _item = this.provider.listenItems()[ id ]

			if ( !connected.includes( _item.endpoint.toString() ) )
				continue

			items.push( {
				label: _item.label,
				link: _item.endpoint,
				type: _item.type,
				created: _item.created,
				// TODO: add mechanism to external store group streams
				// at this stage, there's no mechanism to store these
				external: false,
				group: item.endpoint,
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