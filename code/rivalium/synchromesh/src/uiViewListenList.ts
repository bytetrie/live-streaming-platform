import type { Styles } from "jss"
import { el, mount, RedomComponent } from "redom"
import { UIButton } from "./uiButton"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UILabel, UILabelColor } from "./uiLabel"
import { UIList } from "./uiList"
import { UIListItemAnnotatedLabel, UIListItemAnnotatedLabelUpdateData } from "./uiListItemAnnotatedLabel"
import { UISwitchGroup } from "./uiSwitchGroup"
import { UIText } from "./uiText"
import { UIViewBase, UIViewBaseUpdateData } from "./uiViewBase"
import { UIHelpBubble } from "./uiHelpBubble"
import { UILink } from "./uiLink"

enum CssClass
{
	uiViewListenList = `uiViewListenList`,
	uiViewListenListEmpty = `uiViewListenListEmpty`,
	uiViewListenListAnnot = `uiViewListenListAnnot`,
	uiViewListenListBlock = `uiViewListenListBlock`,
	uiViewListenListList = `uiViewListenListList`
}

enum ListenItemType
{
	mine = `Your recording`,
	shared = `Shared with you`,
	group = `Group`
}

enum ListenListFilterState
{
	mine = `My recordings`,
	shared = `Shared with me`,
	group = `Groups`
}

export interface UIViewListenListHandler
{
	/**
	 * User requests to create a new listen group
	 */
	requestCreateNewGroup: () => void
	/**
	 * Switch to list of recording items
	 */
	gotoRecordingList: ( linkHREF: string ) => void
	/**
	 * View the listen item associated with the given link
	 */
	gotoListenItem: ( linkHREF: string ) => void
}

export interface UIListenListItem
{
	link: URL
	label: string
	created: Date
	type: ListenItemType
	playing: boolean
}

interface UIListenListItemInternal extends UIListenListItem
{
	playingUI: UILabel
}

export interface UIViewListenListUpdateData extends UIViewBaseUpdateData
{
	item?: UIListenListItem
	updateLabel?: {link: URL, label: string}
	updatePlaying?: {link: URL, playing: boolean}
	remove?: URL
}

enum Bubble
{
	addGroupButton,
	listenItemList
}

export class UIViewListenList implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: UIViewBase

	public classes?: Record<CssClass, string>

	private base: HTMLElement

	private newGroup: UIButton

	private currentFilterState: ListenListFilterState[]

	private filterStates: ListenListFilterState[]

	private filterToggle: UISwitchGroup

	private currentFilterIndices: number[]

	private orderings: Record<string, string[]>

	private list: UIList<UIListItemAnnotatedLabelUpdateData>

	private emptyList: UIText

	private listIsEmpty: boolean

	private items: Record<string, UIListenListItemInternal>

	private typeMap: Record<string, ListenListFilterState>

	private emptyFilter: boolean

	private listBlock: HTMLElement

	private bubbles: UIHelpBubble[]

	constructor(
		private helper: UIMetaHelper,
		private handler: UIViewListenListHandler,
		menuURL: string )
	{
		this.id = `UIViewListenList`

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.bubbles = this.buildBubbles()

		this.onFilterSwitchClick = this.onFilterSwitchClick.bind( this )

		this.newGroup = new UIButton( this.helper, `Add new group`, { onClick: this.handler.requestCreateNewGroup } )

		this.items = {}

		this.listIsEmpty = true

		this.emptyFilter = false

		this.orderings = {}

		this.currentFilterState = Object.values( ListenListFilterState )

		this.currentFilterIndices = Array( this.currentFilterState.length )
			.fill( undefined )
			.map( ( _, i ) => i )

		this.filterStates = Object.values( ListenListFilterState )

		const itemTypes = Object.entries( ListenListFilterState )

		this.typeMap = Object.entries( ListenItemType ).reduce<Record<string, ListenListFilterState>>( ( map, [ k, v ] ) =>
		{
			const type = itemTypes.find( item => item[ 0 ] === k )?.[ 1 ]

			if ( type ) map[ v ] = type 

			return map
		}, {} )

		this.filterToggle = new UISwitchGroup(
			this.helper,
			this.filterStates,
			{
				onClick: this.onFilterSwitchClick
			},
			this.currentFilterIndices,
			true
		)
		
		this.list = new UIList( this.helper, UIListItemAnnotatedLabel )

		this.listBlock = el( `div`, [ new UIText( this.helper, `Show streams from:` ), this.filterToggle, this.list ] )

		this.emptyList = new UIText( this.helper, `You have no streams on this device.` )

		this.base = el( `div`, [
			this.newGroup,
			this.bubbles[ Bubble.addGroupButton ],
			this.emptyList,
			this.bubbles[ Bubble.listenItemList ]
		] )

		this.el = new UIViewBase(
			this.helper,
			`Switch to recording list`,
			menuURL,
			{ gotoMenuURL: this.handler.gotoRecordingList } )

		this.el.update( { content: [ this.base ], bubbles: this.bubbles } )

		this.helper.setCss( this.el.el, this, CssClass.uiViewListenList )
		
		this.helper.setCss( this.emptyList.el, this, CssClass.uiViewListenListEmpty )
		
		this.helper.setCss( this.listBlock, this, CssClass.uiViewListenListBlock )
		
		this.helper.setCss( this.list.el, this, CssClass.uiViewListenListList )
	}

	private buildBubbles()
	{
		return [
			// addGroupButton
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `Generates a new group and navigates to the new group's page.` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `Groups allow you (and others) to collect and share multiple streams.` ) ] ),

			// listenItemList
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `This list displays the streams and groups available on this device.` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `On the left is the stream link and name:` ),
					el( `br` ),
					new UIText( this.helper, `The item link and added date is at the top, e.g.: ` ),
					new UILink( this.helper, `#`, `16/05/2021, 2:39:16 pm`, { onLinkClick: () => void {} } ),
					el( `br` ),
					new UIText( this.helper, `The item's name underneath, e.g.: Stream from 16/05/2021, 2:39:16 pm` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `On the right is the playback state:` ),
					el( `br` ),
					new UIText( this.helper, `The item is currently playing: ` ),
					new UILabel(
						this.helper,
						this.labelColor( true ),
						this.labelText( true ) ),
					el( `br` ),
					new UIText( this.helper, `The item is paused: ` ),
					new UILabel(
						this.helper,
						this.labelColor( false ),
						this.labelText( false ) )
				] )
		]
	}

	private getOrderingKey()
	{
		return this.currentFilterState.join( `_` )
	}

	private getOrdering()
	{
		const key = this.getOrderingKey()
		
		if ( !this.orderings[ key ] )
		{
			this.orderings[ key ] = Object.values( this.items )
				.filter( item => this.currentFilterState.includes( this.typeMap[ item.type ] ) )
				.sort( ( a, b ) => ( a.playing === b.playing ? 0 : a.playing ? -1 : 1 ) || a.label.localeCompare( b.label ) )
				.map( item => item.link.toString() )
		}

		return this.orderings[ key ]
	}

	private clearOrdering()
	{
		this.orderings = {}
	}

	private onFilterSwitchClick( index: number )
	{
		const state = this.filterStates[ index ]

		if ( this.currentFilterState.includes( state ) )
		{
			this.currentFilterState = this.currentFilterState.filter( s => s !== state )

			this.currentFilterIndices = this.currentFilterIndices.filter( i => i !== index )
		}
		else
		{
			this.currentFilterState.push( state )

			this.currentFilterIndices.push( index )
		}

		this.filterToggle.update( this.currentFilterIndices )

		this.updateOrderingVisibility()
	}

	private updateOrderingVisibility()
	{
		const ordering = this.getOrdering()

		this.list.update( { ordering } )

		if ( ordering.length === 0 && !this.emptyFilter )
		{
			this.emptyFilter = true

			mount( this.listBlock, this.emptyList, this.list, true )
		}
		else if ( ordering.length > 0 && this.emptyFilter )
		{
			this.emptyFilter = false

			mount( this.listBlock, this.list, this.emptyList, true )
		}
	}

	private labelText( playing: boolean )
	{
		return playing ? `Playing` : `Paused`
	}

	private labelColor( playing: boolean )
	{
		return playing ? UILabelColor.blue : UILabelColor.grey
	}

	private label( playing: boolean )
	{
		const label = new UILabel( this.helper, this.labelColor( playing ), this.labelText( playing ) )

		this.helper.setCss( label.el, this, CssClass.uiViewListenListAnnot )

		return label
	}

	private add( item: UIListenListItem )
	{
		this.clearOrdering()

		const id = item.link.toString()

		if ( this.items[ id ] ) return

		const playingUI = this.label( item.playing )

		this.items[ id ] = { ...item, playingUI }

		this.list.update( { 
			item: { 
				id, 
				data:
				{
					annotation: playingUI,
					linkHREF: id,
					linkText: item.created.toLocaleString(),
					subtext: item.label,
					gotoItem: this.handler.gotoListenItem
				} 
			} } )

		if ( this.listIsEmpty )
		{
			this.listIsEmpty = false

			mount( this.base, this.listBlock, this.emptyList, true )

			this.emptyList.el.textContent = `There are no items to show.`
		}

		this.updateOrderingVisibility()
	}

	private updateItem( link: URL, label?: string, playing?: boolean )
	{
		this.clearOrdering()

		const id = link.toString()
		
		if ( !this.items[ id ] ) return

		if ( label !== undefined )
		{
			this.items[ id ].label = label
		}

		if ( playing !== undefined )
		{
			this.items[ id ].playing = playing
			
			this.items[ id ].playingUI.update( { color: this.labelColor( playing ), text: this.labelText( playing ) } )
		}

		this.list
			.update( {
				update: {
					id,
					data:
					{
						linkHREF: id,
						linkText: this.items[ id ].created.toLocaleString(),
						subtext: this.items[ id ].label
					}
				} } )
		
		this.updateOrderingVisibility()
	}

	private removeItem( link: URL )
	{
		this.clearOrdering()

		const id = link.toString()
		
		if ( !this.items[ id ] ) return

		delete this.items[ id ]

		this.list.update( { remove: id } )
		
		this.updateOrderingVisibility()
	}

	public update( { item, updatePlaying, updateLabel, remove, ...base }: UIViewListenListUpdateData ): this
	{
		if ( remove ) this.removeItem( remove )

		if ( item ) this.add( item )

		if ( updateLabel ) this.updateItem( updateLabel.link, updateLabel.label )

		if ( updatePlaying ) this.updateItem( updatePlaying.link, undefined, updatePlaying.playing )

		this.el.update( base )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiViewListenList: {},
			uiViewListenListAnnot: {
				whiteSpace: `nowrap`
			},
			uiViewListenListEmpty: {
				display: `block`,
				marginTop: `1.5rem`
			},
			uiViewListenListBlock: {
				marginTop: `1.5rem`,
				'& > *:first-child': {
					display: `block`,
					marginBottom: `0.5rem`
				}
			},
			uiViewListenListList: {
				marginTop: `1rem !important`,
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}