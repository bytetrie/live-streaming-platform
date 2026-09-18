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
import { UIHelpBubble } from "./uiHelpBubble"
import { UILink } from "./uiLink"

enum CssClass
{
	uiViewGroupEditStreams = `uiViewGroupEditStreams`,
	uiViewGroupEditStreamsList = `uiViewGroupEditStreamsList`
}

enum ListenItemType
{
	mine = `Your recording`,
	shared = `Shared with you`,
	group = `Group`
}

export interface UIViewGroupEditStreamsHandler
{
	/**
	 * User requests removal of stream from current listen group
	 */
	requestRemoveStreamFromGroup: ( group: URL, stream: URL ) => void
	/**
	 * Go to the current listen group
	 */
	gotoGroup: ( linkHREF: string ) => void
	/**
	 * Go to the selected item
	 */
	gotoListenItem: ( linkHREF: string ) => void
}

export interface UIGroupEditItem
{
	group: URL
	link: URL
	label: string
	created: Date
	type: ListenItemType
	/**
	 * Indicates if this stream is in the group
	 * but someone else added it (ie there's no 
	 * ID available on the device to remove it)
	 */
	external: boolean
}

interface UIGroupEditItemInternal extends UIGroupEditItem
{
	removeButton?: UIButton
	stateLabel: UILabel
	loading?: UILoadingMessage
}

export interface UIViewGroupEditStreamsUpdateData extends UIViewBaseUpdateData
{
	removed?: string
}

enum Bubble
{
	list
}

export class UIViewGroupEditStreams implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: UIViewBase

	public classes?: Record<CssClass, string>

	private base: HTMLElement

	private ordering: string[]

	private list: UIList<UIListItemAnnotatedLabelUpdateData>

	private emptyList: UIText

	private listIsEmpty: boolean

	private items: Record<string, UIGroupEditItemInternal>

	private bubbles: UIHelpBubble[]

	constructor(
		private helper: UIMetaHelper,
		private handler: UIViewGroupEditStreamsHandler,
		menuURL: string,
		items: UIGroupEditItem[] )
	{
		this.id = `UIViewGroupEditStreams`

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.onRemove = this.onRemove.bind( this )

		this.bubbles = [
			// list
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `This list displays the streams available on this device that were added to the current group.` ),
					el( `br` ),
					new UIText( this.helper, `
						You can remove these streams from the group and they will no longer 
						be available discoverable via the group. The only exception is if
						someone else also added the same stream to the group.` ),
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
					new UIButton( this.helper, `Remove stream`, { onClick: () => void {} } ),
					new UIText( this.helper, ` clicking this button will remove the stream from the current group.` ),
					el( `br` ),
					el( `br` ),
					new UILabel( this.helper, UILabelColor.red, `Removed` ),
					new UIText( this.helper, ` indicates the stream was removed from the current group.` )
				] )
		]

		this.list = new UIList( this.helper, UIListItemAnnotatedLabel )

		this.items = {}

		this.listIsEmpty = true

		this.ordering = []
		
		this.emptyList = new UIText( this.helper, `You added no streams from this device.` )

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

		this.helper.setCss( this.el.el, this, CssClass.uiViewGroupEditStreams )

		this.helper.setCss( this.list.el, this, CssClass.uiViewGroupEditStreamsList )
	}

	private onRemove( id: string )
	{
		if ( !this.items[ id ] ) return

		this.list.update( { update: { 
			id: id, 
			data: { annotation: this.items[ id ].loading } } } )

		this.handler.requestRemoveStreamFromGroup( this.items[ id ].group, this.items[ id ].link )
	}

	private setItems( items: UIGroupEditItem[] )
	{
		this.list.update( { clear: true } )

		this.ordering = []

		this.items = {}

		if ( !items )
		{
			if ( !this.listIsEmpty )
			{
				this.listIsEmpty = true

				mount( this.base, this.emptyList, this.list, true )
			}
		}

		for ( const item of items )
		{
			const id = item.link.toString()

			if ( this.items[ id ] ) return
	
			const addButton = new UIButton(
				this.helper,
				`Remove stream`,
				{ onClick: () => 
				{
					this.onRemove( id ) 
				} }
			)
	
			this.items[ id ] = { 
				...item, 
				removeButton: addButton, 
				stateLabel: new UILabel( this.helper, UILabelColor.red, `Removed` ),
				loading: new UILoadingMessage( this.helper, `Removing` )
			}
	
			this.list.update( { 
				item: {
					id, 
					data:
					{
						annotation: item.external
							? new UILabel( this.helper, UILabelColor.grey, `External` ) 
							: addButton,
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

	public update( { removed, ...base }: UIViewGroupEditStreamsUpdateData ): this
	{
		if ( removed )
		{
			this.list.update( { update: { 
				id: removed, 
				data: {
					annotation: this.items[ removed ].stateLabel
				} } } )
		}

		this.el.update( base )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiViewGroupEditStreams: {},
			uiViewGroupEditStreamsList: {
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