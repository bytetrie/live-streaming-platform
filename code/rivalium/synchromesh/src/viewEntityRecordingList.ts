import { UIMetaViewManager, View } from "./uiMetaViewManager"
import type { ViewEntity } from "./viewManagerHandler"

export interface ViewEntityRecordingListProvider
{
	recordingItems: () => Record<string, RecordingItem>

	navigationURL: () => URL
}

export class ViewEntityRecordingList implements ViewEntity
{
	public view: View.recordingList

	constructor(
		public ui: UIMetaViewManager,
		public route: string,
		private provider: ViewEntityRecordingListProvider )
	{
		this.onRouteUpdate = this.onRouteUpdate.bind( this )

		this.onFirstLoad = this.onFirstLoad.bind( this )

		this.view = View.recordingList
	}

	public onRouteUpdate(): void
	{
		this.ui.update( { setView: { 
			view: this.view, 
			navigationURL: this.provider.navigationURL() } } )
	}

	public onFirstLoad(): void
	{
		for ( const item in this.provider.recordingItems() )
		{
			const i = this.provider.recordingItems()[ item ]

			if ( i.redirect ) continue

			this.ui.update( { recordingListUpdate: { item: {
				label: i.label,
				link: i.endpoint,
				date: i.created,
				state: i.state
			} } } )
		}
	}

}