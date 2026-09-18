import { UIMetaViewManager, View } from "./uiMetaViewManager"
import type { ViewEntity } from "./viewManagerHandler"

export interface ViewEntityListenListProvider
{
	listenItems: () => Record<string, ListenItem>

	navigationURL: () => URL
}

export class ViewEntityListenList implements ViewEntity
{
	public view: View.listenList

	constructor(
		public ui: UIMetaViewManager,
		public route: string,
		private provider: ViewEntityListenListProvider )
	{
		this.onRouteUpdate = this.onRouteUpdate.bind( this )

		this.onFirstLoad = this.onFirstLoad.bind( this )

		this.view = View.listenList
	}

	public onRouteUpdate(): void
	{
		this.ui.update( { setView: { 
			view: this.view, 
			navigationURL: this.provider.navigationURL() } } )
	}

	public onFirstLoad(): void
	{
		// TODO: filter items with remote counterpart

		for ( const item in this.provider.listenItems() )
		{
			const i = this.provider.listenItems()[ item ]

			if ( i.redirect ) continue

			this.ui.update( { listenListUpdate: { item: {
				label: i.label,
				link: i.endpoint,
				playing: i.playing,
				type: i.type,
				created: i.created
			} } } )
		}
		// update view with full list
		// subsequent requests alter view
	}

}