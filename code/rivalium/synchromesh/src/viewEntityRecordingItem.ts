import { UIMetaViewManager, View } from "./uiMetaViewManager"
import type { ViewEntity } from "./viewManagerHandler"

export interface ViewEntityRecordingItemHandler
{
	gotoRecordingList: () => void

	updateRecordingItem: ( id: URL, data: Partial<RecordingItem> ) => void

	onError: ( error: string | Error | ErrorEvent ) => void
}

export interface ViewEntityRecordingItemProvider
{
	currentRecordingItem: () => RecordingItem | undefined

	listenItems: () => Record<string, ListenItem>

	navigationURL: () => URL

	idFromURL: ( url: URL ) => string
}

export class ViewEntityRecordingItem implements ViewEntity
{
	public view: View.recordingItem

	constructor(
		public ui: UIMetaViewManager,
		public route: string,
		private provider: ViewEntityRecordingItemProvider,
		private handler: ViewEntityRecordingItemHandler,
		private adminSharePrefix: string,
		private publicSharePrefix: string )
	{
		this.onRouteUpdate = this.onRouteUpdate.bind( this )

		this.onFirstLoad = this.onFirstLoad.bind( this )

		this.view = View.recordingItem
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

	public onRecordingItemLabelChanged( label: string ): void
	{
		const item = this.checkCurrent()

		if ( !item ) return

		const id = item.endpoint

		this.handler.updateRecordingItem( id, { label } )

		this.ui.update( { 
			recordingListUpdate: { updateLabel: { link: id, label } },
			recordingItemUpdate: { id: id.toString(), data: { label } } } )
	}

	public onRouteUpdate(): void
	{
		const item = this.checkCurrent()

		if ( !item ) return

		this.ui.update( { setView: {
			view: this.view, 
			navigationURL: this.provider.navigationURL(),
			id: item.endpoint.toString(),
			created: item.created
		} } )
	}

	public onFirstLoad(): void
	{
		const item = this.checkCurrent()

		if ( !item ) return

		const isLocal = this.provider.listenItems()[ item.listen.toString() ].local

		const adminID = this.provider.idFromURL( item.endpoint )

		const publicID = this.provider.idFromURL( item.listen )

		const adminShareURL = adminID
			? `${this.adminSharePrefix}${adminID}`
			: item.endpoint.toString()

		const publicShareURL = adminID
			? `${this.publicSharePrefix}${publicID}`
			: item.listen.toString()

		this.ui.update( { recordingItemUpdate: {
			id: item.endpoint.toString(),
			data: {
				label: item.label,
				cloudData: isLocal 
					? undefined 
					: {
						adminShareURL,
						publicShareURL,
						publicURL: item.listen
					},
				listenLink: isLocal 
					? item.listen 
					: undefined,
				updateRecordingState: {
					hasSource: item.sourceID !== undefined,
					recordingState: item.state
				}
			}
		} } )
		// update view with item data
		// subsequent requests alter view
	}

}