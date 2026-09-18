import type { Styles } from "jss"
import { el, RedomComponent, setChildren } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UIGroupAddItem, UIViewGroupAddStreams, UIViewGroupAddStreamsHandler, UIViewGroupAddStreamsUpdateData } from "./uiViewGroupAddStreams"
import { UIGroupEditItem, UIViewGroupEditStreams, UIViewGroupEditStreamsHandler, UIViewGroupEditStreamsUpdateData } from "./uiViewGroupEditStreams"
import { UISourceConnectionListItem, UIViewSourceItem, UIViewSourceItemHandler, UIViewSourceItemUpdateData } from "./uiViewSourceItem"
import { UIViewListenItem, UIViewListenItemHandler, UIViewListenItemUpdateData } from "./uiViewListenItem"
import { UIViewListenList, UIViewListenListHandler, UIViewListenListUpdateData } from "./uiViewListenList"
import { UIViewSourceList, UIViewSourceListHandler, UIViewSourceListUpdateData } from "./uiViewSourceList"
import { UIViewRecordingItem, UIViewRecordingItemHandler, UIViewRecordingItemUpdateData } from "./uiViewRecordingItem"
import { UIViewRecordingList, UIViewRecordingListHandler, UIViewRecordingListUpdateData } from "./uiViewRecordingList"
import { UIViewLoading } from "./uiViewLoading"

enum CssClass
{
	uiMetaViewManager = `uiMetaViewManager`,
}

export enum ListenItemType
{
	mine = `Your recording`,
	shared = `Shared with you`,
	group = `Group`
}

export enum View
{
	recordingList,
	recordingItem,
	sourceList,
	sourceItem,
	listenList,
	listenItem,
	listenAdd,
	listenEdit,
	loading
}

interface SetViewBase
{
	navigationURL: URL
	// helpURL: URL
}

interface SetViewEditStreams extends SetViewBase
{
	view: View.listenEdit
	items: UIGroupEditItem[]
}

interface SetViewAddStreams extends SetViewBase
{
	view: View.listenAdd
	items: UIGroupAddItem[]
}

interface SetViewListenItem extends SetViewBase
{
	view: View.listenItem
	id: string
	type: ListenItemType
	publicURL: URL
	shareURL: string
	created: Date
	adminURL?: string
}

interface SetViewListenList extends SetViewBase
{
	view: View.listenList
}

interface SetViewSourceItem extends SetViewBase
{
	view: View.sourceItem
	id: string
	label: string,
	connections: UISourceConnectionListItem[]
}

interface SetViewSourceList extends SetViewBase
{
	view: View.sourceList
}

interface SetViewRecordingItem extends SetViewBase
{
	view: View.recordingItem
	id: string
	created: Date
}

interface SetViewRecordingList extends SetViewBase
{
	view: View.recordingList
}

interface SetViewLoading
{
	view: View.loading
}

type SetView = 
	| SetViewRecordingList
	| SetViewRecordingItem
	| SetViewSourceList
	| SetViewSourceItem
	| SetViewListenList
	| SetViewListenItem
	| SetViewAddStreams
	| SetViewEditStreams
	| SetViewLoading

export interface UIMetaViewManagerUpdateData
{
	setView?: SetView
	recordingListUpdate?: UIViewRecordingListUpdateData
	recordingItemUpdate?: {id: string, data: UIViewRecordingItemUpdateData}
	sourceListUpdate?: UIViewSourceListUpdateData
	sourceItemUpdate?: {id: string, data: UIViewSourceItemUpdateData}
	listenItemUpdate?: {id: string, data: UIViewListenItemUpdateData}
	listenListUpdate?: UIViewListenListUpdateData
	groupAddUpdate?: UIViewGroupAddStreamsUpdateData
	groupEditUpdate?: UIViewGroupEditStreamsUpdateData
}

export interface UIMetaViewManagerHandler
extends
	UIViewListenListHandler,
	UIViewGroupAddStreamsHandler,
	UIViewGroupEditStreamsHandler,
	UIViewRecordingListHandler,
	// context driven -----V
	UIViewSourceListHandler,
	UIViewListenItemHandler,
	UIViewRecordingItemHandler,
	UIViewSourceItemHandler
{
	onViewFirstLoad: ( view: View ) => void
}

export class UIMetaViewManager implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private rootViews: {
		[ View.recordingList ]: UIViewRecordingList | undefined,
		[ View.sourceList ]: UIViewSourceList | undefined,
		[ View.listenList ]: UIViewListenList | undefined,
		[ View.listenAdd ]: UIViewGroupAddStreams | undefined,
		[ View.listenEdit ]: UIViewGroupEditStreams | undefined,
		[ View.loading ]: UIViewLoading
	}

	private itemViews: {
		[ View.listenItem ]: Record<string, UIViewListenItem>,
		[ View.sourceItem ]: Record<string, UIViewSourceItem>,
		[ View.recordingItem ]: Record<string, UIViewRecordingItem>,
	}

	private updateView: Record<View, ( view: SetView ) => void>

	constructor( private helper: UIMetaHelper, private handler: UIMetaViewManagerHandler )
	{
		this.id = `UIMetaViewManager`

		this.el = el( `div` )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiMetaViewManager )

		this.rootViews = {
			[ View.recordingList ]: undefined,
			[ View.sourceList ]: undefined,
			[ View.listenList ]: undefined,
			[ View.listenAdd ]: undefined,
			[ View.listenEdit ]: undefined,
			[ View.loading ]: new UIViewLoading( this.helper )
		}

		this.itemViews = {
			[ View.listenItem ]: {},
			[ View.sourceItem ]: {},
			[ View.recordingItem ]: {},
		}

		this.updateView = {
			[ View.listenList ]: ( setView: SetView ) =>
				this.updateListenList( setView ),
			[ View.listenAdd ]: ( setView: SetView ) =>
				this.updateListenAdd( setView ),
			[ View.listenEdit ]: ( setView: SetView ) =>
				this.updateListenEdit( setView ),
			[ View.listenItem ]: ( setView: SetView ) =>
				this.updateListenItem( setView ),
			[ View.recordingItem ]: ( setView: SetView ) =>
				this.updateRecordingItem( setView ),
			[ View.recordingList ]: ( setView: SetView ) =>
				this.updateRecordingList( setView ),
			[ View.sourceItem ]: ( setView: SetView ) =>
				this.updateSourceItem( setView ),
			[ View.sourceList ]: ( setView: SetView ) =>
				this.updateSourceList( setView ),
			[ View.loading ]: () =>
				this.setView( this.rootViews[ View.loading ] ),
		}
	}

	private setView( view: RedomComponent | undefined )
	{
		// error?
		if ( !view ) return

		setChildren( this.el, [ view.el ] )
	}

	private processUpdate( {
		groupAddUpdate, 
		groupEditUpdate, 
		listenItemUpdate, 
		listenListUpdate,
		recordingItemUpdate,
		recordingListUpdate,
		sourceItemUpdate,
		sourceListUpdate }: Omit<UIMetaViewManagerUpdateData, `setView`> )
	{
		/**
		 * Listen list and Recording list include methods to
		 * add new data, so these requests should be handled first
		 */
		if ( listenListUpdate )
			this.rootViews[ View.listenList ]?.update( listenListUpdate )

		if ( recordingListUpdate )
			this.rootViews[ View.recordingList ]?.update( recordingListUpdate )

		/**
		 * ----------------- Other requests -----------------
		 */

		if ( groupAddUpdate )
			this.rootViews[ View.listenAdd ]?.update( groupAddUpdate )

		if ( groupEditUpdate )
			this.rootViews[ View.listenEdit ]?.update( groupEditUpdate )

		if ( listenItemUpdate )
			this.itemViews[ View.listenItem ]?.
				[ listenItemUpdate.id ]?.
				update( listenItemUpdate.data )

		if ( recordingItemUpdate )
			this.itemViews[ View.recordingItem ]?.
				[ recordingItemUpdate.id ]?.
				update( recordingItemUpdate.data )

		if ( sourceItemUpdate )
			this.itemViews[ View.sourceItem ]?.
				[ sourceItemUpdate.id ]?.
				update( sourceItemUpdate.data )

		if ( sourceListUpdate )
			this.rootViews[ View.sourceList ]?.update( sourceListUpdate )
	}

	private updateListenList( setView: SetView )
	{
		if ( setView.view !== View.listenList ) return
		// this view is only created once

		if ( !this.rootViews[ View.listenList ] )
		{
			this.rootViews[ View.listenList ] = new UIViewListenList(
				this.helper, 
				this.handler, 
				setView.navigationURL.toString() )

			this.handler.onViewFirstLoad( setView.view )
		}

		this.setView( this.rootViews[ View.listenList ] )
	}

	private updateListenAdd( setView: SetView )
	{
		if ( setView.view !== View.listenAdd ) return
		// each time this route is visited, the view is re-instantiated

		this.rootViews[ View.listenAdd ] = new UIViewGroupAddStreams(
			this.helper, 
			this.handler, 
			setView.navigationURL.toString(),
			setView.items )

		this.handler.onViewFirstLoad( setView.view )

		this.setView( this.rootViews[ View.listenAdd ] )
	}

	private updateListenEdit( setView: SetView )
	{
		if ( setView.view !== View.listenEdit ) return
		// each time this route is visited, the view is re-instantiated

		this.rootViews[ View.listenEdit ] = new UIViewGroupEditStreams(
			this.helper, 
			this.handler, 
			setView.navigationURL.toString(),
			setView.items )

		this.handler.onViewFirstLoad( setView.view )

		this.setView( this.rootViews[ View.listenEdit ] )
	}

	private updateListenItem( setView: SetView )
	{
		if ( setView.view !== View.listenItem ) return
		// One view per listen entry

		if ( !this.itemViews[ View.listenItem ][ setView.id ] )
		{
			this.itemViews[ View.listenItem ][ setView.id ] = new UIViewListenItem(
				this.helper, 
				this.handler, 
				setView.navigationURL.toString(),
				setView.type,
				setView.publicURL.toString(),
				setView.shareURL,
				setView.created,
				setView.adminURL )

			this.handler.onViewFirstLoad( setView.view )
		}

		this.setView( this.itemViews[ View.listenItem ][ setView.id ] )
	}

	private updateRecordingItem( setView: SetView )
	{
		if ( setView.view !== View.recordingItem ) return
		// One view per recording entry

		if ( !this.itemViews[ View.recordingItem ][ setView.id ] )
		{
			this.itemViews[ View.recordingItem ][ setView.id ] = new UIViewRecordingItem(
				this.helper, 
				this.handler, 
				setView.navigationURL.toString(),
				setView.created )

			this.handler.onViewFirstLoad( setView.view )
		}

		this.setView( this.itemViews[ View.recordingItem ][ setView.id ] )
	}

	private updateRecordingList( setView: SetView )
	{
		if ( setView.view !== View.recordingList ) return
		// this view is only created once

		if ( !this.rootViews[ View.recordingList ] )
		{
			this.rootViews[ View.recordingList ] = new UIViewRecordingList(
				this.helper, 
				this.handler, 
				setView.navigationURL.toString() )

			this.handler.onViewFirstLoad( setView.view )
		}

		this.setView( this.rootViews[ View.recordingList ] )
	}

	private updateSourceItem( setView: SetView )
	{
		if ( setView.view !== View.sourceItem ) return
		// One view per source entry

		if ( !this.itemViews[ View.sourceItem ][ setView.id ] )
		{
			this.itemViews[ View.sourceItem ][ setView.id ] = new UIViewSourceItem(
				this.helper, 
				this.handler, 
				setView.navigationURL.toString(),
				setView.label,
				setView.connections )

			this.handler.onViewFirstLoad( setView.view )
		}

		this.setView( this.itemViews[ View.sourceItem ][ setView.id ] )
	}

	private updateSourceList( setView: SetView )
	{
		if ( setView.view !== View.sourceList ) return
		// this view is only created once

		if ( !this.rootViews[ View.sourceList ] )
		{
			this.rootViews[ View.sourceList ] = new UIViewSourceList(
				this.helper, 
				this.handler, 
				setView.navigationURL.toString() )

			this.handler.onViewFirstLoad( setView.view )
		}

		this.setView( this.rootViews[ View.sourceList ] )
	}

	public update( { setView, ...update }: UIMetaViewManagerUpdateData ): this
	{
		this.processUpdate( update )

		if ( setView ) this.updateView[ setView.view ]( setView )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiMetaViewManager: {
				height: `100%`
			},
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}