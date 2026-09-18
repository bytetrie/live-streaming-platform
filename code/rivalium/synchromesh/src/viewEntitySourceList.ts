import { UIMetaViewManager, View } from "./uiMetaViewManager"
import type { ViewEntity } from "./viewManagerHandler"

export interface ViewEntitySourceListProvider
{
	currentRecordingItem: () => RecordingItem | undefined

	sourceItems: () => Record<string, SourceItem>

	navigationURL: () => URL
}

export interface ViewEntitySourceListHandler
{
	gotoRecordingList: () => void

	onError: ( error: string | Error | ErrorEvent ) => void
}

export class ViewEntitySourceList implements ViewEntity
{
	public view: View.sourceList

	constructor(
		public ui: UIMetaViewManager,
		public route: string,
		private provider: ViewEntitySourceListProvider,
		private handler: ViewEntitySourceListHandler )
	{
		this.onRouteUpdate = this.onRouteUpdate.bind( this )

		this.onFirstLoad = this.onFirstLoad.bind( this )

		this.view = View.sourceList
	}

	private checkCurrent(): RecordingItem | undefined
	{
		const item = this.provider.currentRecordingItem()

		if ( !item )
		{
			this.handler.onError( Error( `Could not load data` ) )

			this.handler.gotoRecordingList()

			return
		}

		return item
	}

	public onRouteUpdate(): void
	{
		const item = this.checkCurrent()

		if ( !item ) return

		const { sourceID } = item

		const url = this.provider.navigationURL()

		this.ui.update( { 
			setView: { 
				view: this.view, 
				navigationURL: url,
			},
			sourceListUpdate: {
				selected: sourceID ?? ``,
				menuBtnURL: url.toString()
			} } )
	}

	public onFirstLoad(): void
	{
		for ( const item in this.provider.sourceItems() )
		{
			const i = this.provider.sourceItems()[ item ]

			this.ui.update( { sourceListUpdate: { item: {
				label: i.label,
				link: i.endpoint
			} } } )
		}
		// update view with full list
		// subsequent requests alter view
	}
}