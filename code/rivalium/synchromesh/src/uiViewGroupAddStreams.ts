import type { Styles } from "jss"
import { el, mount, RedomComponent } from "redom"
import { UIButton } from "./uiButton"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UILabel, UILabelColor } from "./uiLabel"
import { UIList } from "./uiList"
import { UIListItemAnnotatedLabel, UIListItemAnnotatedLabelUpdateData } from "./uiListItemAnnotatedLabel"
import { UILoadingMessage } from "./uiLoadingMessage"
import { UIText } from "./uiText"
import { UIViewBase, UIViewBaseUpdateData } from "./uiViewBase"
import { UILink } from "./uiLink"
import { UIHelpBubble } from "./uiHelpBubble"

enum CssClass
{
	uiViewGroupAddStreams = `uiViewGroupAddStreams`,
	uiViewGroupAddStreamsList = `uiViewGroupAddStreamsList`
}

enum ListenItemType
{
	mine = `Your recording`,
	shared = `Shared with you`,
	group = `Group`
}

export interface UIViewGroupAddStreamsHandler
{
	/**
	 * Request add stream, from link reference, to the current listen group
	 */
	requestAddStreamToGroup: ( stream: URL ) => void
	/**
	 * Go to the current listen group
	 */
	gotoGroup: ( linkHREF: string ) => void
	/**
	 * Go to the selected item
	 */
	gotoListenItem: ( linkHREF: string ) => void
}

export interface UIGroupAddItem
{
	link: URL
	label: string
	created: Date
	type: ListenItemType
}

interface UIGroupAddItemInternal extends UIGroupAddItem
{
	addButton: UIButton
	stateLabel: UILabel
	loading: UILoadingMessage
}

export interface UIViewGroupAddStreamsUpdateData extends UIViewBaseUpdateData
{
	added?: string
}

enum Bubble
{
	list
}

export class UIViewGroupAddStreams implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: UIViewBase

	public classes?: Record<CssClass, string>

	private base: HTMLElement

	private ordering: string[]

	private list: UIList<UIListItemAnnotatedLabelUpdateData>

	private emptyList: UIText

	private listIsEmpty: boolean

	private items: Record<string, UIGroupAddItemInternal>

	private bubbles: UIHelpBubble[]

	constructor(
		private helper: UIMetaHelper,
		private handler: UIViewGroupAddStreamsHandler,
		menuURL: string,
		items: UIGroupAddItem[] )
	{
		this.id = `UIViewGroupAddStreams`

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.onAdd = this.onAdd.bind( this )

		this.bubbles = [
			// list
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `This list displays the streams available on this device that can be added to the current group.` ),
					el( `br` ),
					new UIText( this.helper, `Only streams with cloud endpoints and those that have been shared by others can be added to groups.` ),
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
					new UIText( this.helper, `On the right the stream can be added:` ),
					el( `br` ),
					new UIButton( this.helper, `Add stream`, { onClick: () => void {} } ),
					new UIText( this.helper, ` clicking this button will add the stream to the current group.` ),
					el( `br` ),
					el( `br` ),
					new UILabel( this.helper, UILabelColor.blue, `Added` ),
					new UIText( this.helper, ` indicates the stream was added to the current group.` )
				] )
		]

		this.list = new UIList( this.helper, UIListItemAnnotatedLabel )

		this.items = {}

		this.listIsEmpty = true

		this.ordering = []
		
		this.emptyList = new UIText( this.helper, `You have no streams to add from this device.` )

		this.el = new UIViewBase(
			this.helper, 
			`Return to group`, 
			menuURL, 
			{ gotoMenuURL: this.handler.gotoGroup } )

		this.base = el( `div`, [
			this.emptyList,
			this.bubbles[ Bubble.list ]
		] )
		
		this.el.update( { content: [ this.base ], bubbles: this.bubbles } )

		if ( items.length ) this.setItems( items )

		this.helper.setCss( this.el.el, this, CssClass.uiViewGroupAddStreams )

		this.helper.setCss( this.list.el, this, CssClass.uiViewGroupAddStreamsList )
	}

	private onAdd( id: string )
	{
		if ( !this.items[ id ] ) return

		this.list.update( { update: { 
			id: id, 
			data: {
				annotation: this.items[ id ].loading
			} } } )

		this.handler.requestAddStreamToGroup( this.items[ id ].link )
	}

	private setItems( items: UIGroupAddItem[] )
	{
		this.list.update( { clear: true } )

		this.ordering = []

		this.items = {}

		if ( !items && !this.listIsEmpty )
		{
			this.listIsEmpty = true

			mount( this.base, this.emptyList, this.list, true )
		}

		for ( const item of items )
		{
			const id = item.link.toString()

			if ( this.items[ id ] ) return
	
			const addButton = new UIButton(
				this.helper,
				`Add stream`,
				{ onClick: () =>
				{
					this.onAdd( id )
				} }
			)
	
			this.items[ id ] = { 
				...item, 
				addButton, 
				stateLabel: new UILabel( this.helper, UILabelColor.blue, `Added` ),
				loading: new UILoadingMessage( this.helper, `Adding` )
			}
	
			this.list.update( { 
				item: {
					id, 
					data:
					{
						annotation: addButton,
						linkHREF: id,
						linkText: item.created.toLocaleString(),
						subtext: item.label,
						gotoItem: this.handler.gotoListenItem
					} 
				} } )
		}

		this.ordering = Object.values( this.items )
			.sort( ( a, b ) => a.label.localeCompare( b.label ) )
			.map( item => item.link.toString() )

		this.list.update( { ordering: this.ordering } )

		if ( this.listIsEmpty )
		{
			this.listIsEmpty = false

			mount( this.base, this.list, this.emptyList, true )
		}
	}

	public update( { added, ...base }: UIViewGroupAddStreamsUpdateData ): this
	{
		if ( added )
		{
			this.list.update( { update: { 
				id: added, 
				data: {
					annotation: this.items[ added ].stateLabel
				} } } )
		}

		this.el.update( base )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiViewGroupAddStreams: {},
			uiViewGroupAddStreamsList: {
				'& > li > div:first-child': {
					height: `25px`
				}
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}