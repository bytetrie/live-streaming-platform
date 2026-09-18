import { ListenState } from "./uiListenControls"
import { ListenItemType, UIMetaViewManager, View } from "./uiMetaViewManager"
import type { ViewEntity } from "./viewManagerHandler"

export interface ViewEntityListenItemHandler
{
	gotoListenList: () => void

	updateListenItem: ( id: URL, data: Partial<ListenItem> ) => void

	onError: ( error: string | Error | ErrorEvent ) => void
}

export interface ViewEntityListenItemProvider
{
	currentListenItem: () => ListenItem | undefined

	listenItems: () => Record<string, ListenItem>

	navigationURL: () => URL

	idFromURL: ( url: URL ) => string

	getRecordingEndpointForItem: ( url: URL ) => string | undefined
}

export class ViewEntityListenItem implements ViewEntity
{
	public view: View.listenItem

	constructor(
		public ui: UIMetaViewManager,
		public route: string,
		private publicSharePrefix: string,
		private groupSharePrefix: string,
		private listenAdaptor: ListenAdaptor,
		private provider: ViewEntityListenItemProvider,
		private handler: ViewEntityListenItemHandler )
	{
		this.onRouteUpdate = this.onRouteUpdate.bind( this )

		this.onFirstLoad = this.onFirstLoad.bind( this )

		this.updateOutputs = this.updateOutputs.bind( this )

		this.view = View.listenItem
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

	public updateOutputs( id?: string ): void
	{
		let _id = id
		
		if ( !_id )
		{
			const item = this.checkCurrent()

			if ( !item ) return
	
			_id = item.endpoint.toString()
		}

		for ( const item of this.listenAdaptor.outputs() )
		{
			this.ui
				.update( { listenItemUpdate: {
					id: _id,
					data: {
						outputItem: { id: item.id, label: item.label }
					}
				} } )
				.update( { listenItemUpdate: {
					id: _id,
					data: {
						outputState: { id: item.id, state: item.state }
					}
				} } )
		}
	}
	
	public onListenItemLabelChanged( label: string ): void
	{
		const item = this.checkCurrent()

		if ( !item ) return

		const id = item.endpoint

		this.handler.updateListenItem( id, { label } )

		this.ui.update( { 
			listenListUpdate: { updateLabel: { link: id, label } },
			listenItemUpdate: { id: id.toString(), data: { label } } } )
	}

	public onRouteUpdate(): void
	{
		const item = this.checkCurrent()

		if ( !item ) return

		const id = item.endpoint.toString()

		const publicURL = item.type === ListenItemType.group
			? new URL( `${id}/group` )
			: item.endpoint

		for ( const item of this.listenAdaptor.outputs() )
		{
			this.ui.update( { listenItemUpdate: {
				id,
				data: {
					outputState: { id: item.id, state: item.state }
				}
			} } )
		}

		const shareID = this.provider.idFromURL( publicURL )

		const shareURL = shareID
			? `${item.type === ListenItemType.group ? this.groupSharePrefix : this.publicSharePrefix}${shareID}`
			: publicURL.toString()

		const adminURL = item.type === ListenItemType.mine
			? this.provider.getRecordingEndpointForItem( item.endpoint )
			: undefined

		this.ui.update( { setView: {
			view: this.view, 
			navigationURL: this.provider.navigationURL(),
			id,
			publicURL,
			type: item.type,
			shareURL,
			created: item.created,
			adminURL
		} } )
	}

	public onFirstLoad(): void
	{
		const item = this.checkCurrent()

		if ( !item ) return

		const id = item.endpoint.toString()

		this.ui
			.update( { listenItemUpdate: {
				id,
				data: {
					label: item.label,
					updateControls: {
						listenState: ListenState.random
					}
				}
			} } )
			.update( { listenItemUpdate: {
				id,
				data: {
					updateControls: {
						noData: false,
						buffering: false
					}
				}
			} } )

		this.updateOutputs( id )
	}
}