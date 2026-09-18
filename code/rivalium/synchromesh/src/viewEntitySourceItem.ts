import { UIMetaViewManager, View } from "./uiMetaViewManager"
// import type { UISourceConnectionListItem } from "./uiViewSourceItem"
import type { ViewEntity } from "./viewManagerHandler"

export interface ViewEntitySourceItemHandler
{
	// TODO: fall back to source list for current recording item
	gotoRecordingList: () => void

	updateSourceItem: ( id: URL, data: Partial<SourceItem> ) => void

	onError: ( error: string | Error | ErrorEvent ) => void
}

export interface ViewEntitySourceItemProvider
{
	currentSourceItem: () => SourceItem | undefined

	sourceItems: () => Record<string, SourceItem>

	navigationURL: () => URL
}

export class ViewEntitySourceItem implements ViewEntity
{
	public view: View.sourceItem

	constructor(
		public ui: UIMetaViewManager,
		public route: string,
		private provider: ViewEntitySourceItemProvider,
		private handler: ViewEntitySourceItemHandler )
	{
		this.onRouteUpdate = this.onRouteUpdate.bind( this )

		this.onFirstLoad = this.onFirstLoad.bind( this )

		this.view = View.sourceItem
	}

	private checkCurrent(): SourceItem | undefined
	{
		const item = this.provider.currentSourceItem()

		if ( !item )
		{
			this.handler.onError( Error( `Could not load data` ) )

			this.handler.gotoRecordingList()

			return
		}

		return item
	}
	
	public onSourceItemLabelChanged( label: string ): void
	{
		const item = this.checkCurrent()

		if ( !item ) return

		const id = item.endpoint

		this.handler.updateSourceItem( id, { label } )

		this.ui.update( { 
			sourceListUpdate: { updateLabel: { link: id, label } },
			sourceItemUpdate: { id: id.toString(), data: { label } } } )
	}

	public onRouteUpdate(): void
	{
		const item = this.checkCurrent()

		if ( !item ) return

		/*
		TODO: implement connections list
		// loop
		const connections: UISourceConnectionListItem[] = []

		for ( const id of item.connectedRecordingIDs )
		{
			const item = this.itemState.items.recording[ id.toString() ]

			connections.push( {
				date: item.created,
				label: item.label,
				link: id
			} )
		}
		*/

		this.ui.update( { setView: {
			view: this.view, 
			navigationURL: this.provider.navigationURL(),
			id: item.endpoint.toString(),
			connections: [],
			label: item.label
		} } )
	}

	public onFirstLoad(): void
	{
		const item = this.checkCurrent()

		if ( !item ) return

		this.ui.update( { sourceItemUpdate: {
			id: item.endpoint.toString(),
			data: {
				label: item.label,
				monitorState: item.monitoringState
			}
		} } )
		// update view with item data
		// subsequent requests alter view
	}

}