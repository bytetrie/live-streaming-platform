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
import { UILoadingMessage } from "./uiLoadingMessage"

enum CssClass
{
	uiViewRecordingList = `uiViewRecordingList`,
	uiViewRecordingListEmpty = `uiViewRecordingListEmpty`,
	uiViewRecordingListSort = `uiViewRecordingListSort`,
	uiViewRecordingListAnnot = `uiViewRecordingListAnnot`
}

enum RecordingState
{
	notRecording = `Not recording`,
	recording = `Recording`
}

export enum RecordingListSortState
{
	date = `Date`,
	label = `Label`,
	state = `State`
}

export interface UIViewRecordingListHandler
{
	/**
	 * Request create a new recording item
	 */
	requestCreateNewRecording: () => void
	/**
	 * Switch to the listem list
	 */
	gotoListenList: ( linkHREF: string ) => void
	/**
	 * View the recording item associated with the given link
	 */
	gotoRecordingItem: ( linkHREF: string ) => void
}

export interface UIRecordingListItem
{
	link: URL
	label: string
	date: Date
	state: RecordingState
}

interface UIRecordingListItemInternal extends UIRecordingListItem
{
	stateUI: UILabel
}

export interface UIViewRecordingListUpdateData extends UIViewBaseUpdateData
{
	item?: UIRecordingListItem
	updateLabel?: {link: URL, label: string}
	updateState?: {link: URL, state: RecordingState}
	remove?: URL
	setAddRecordingState?: boolean
}

enum Bubble
{
	addRecordingButton,
	recordingItemList
}

export class UIViewRecordingList implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: UIViewBase

	public classes?: Record<CssClass, string>

	private base: HTMLElement

	private newRecording: UIButton

	private currentSortState: RecordingListSortState

	private sortStates: RecordingListSortState[]

	private sortToggle: UISwitchGroup

	private sortBlock: HTMLElement

	private orderings: Record<RecordingListSortState, string[]>

	private list: UIList<UIListItemAnnotatedLabelUpdateData>

	private emptyList: UIText

	private listIsEmpty: boolean

	private items: Record<string, UIRecordingListItemInternal>

	private bubbles: UIHelpBubble[]

	private newLoadingState: boolean

	private newRecordingLoader: UILoadingMessage

	constructor(
		private helper: UIMetaHelper,
		private handler: UIViewRecordingListHandler,
		menuURL = `#` )
	{
		this.id = `UIViewRecordingList`

		this.onSortSwitchClick = this.onSortSwitchClick.bind( this )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.bubbles = this.buildBubbles()

		this.newLoadingState = false

		this.newRecordingLoader = new UILoadingMessage( this.helper, `Creating new stream` )

		this.newRecording = new UIButton(
			this.helper,
			`Add new recording`,
			{ onClick: this.handler.requestCreateNewRecording } )

		this.items = {}

		this.listIsEmpty = true

		this.orderings = {
			[ RecordingListSortState.date ]: [],
			[ RecordingListSortState.label ]: [],
			[ RecordingListSortState.state ]: [],
		}

		this.currentSortState = RecordingListSortState.date

		this.sortStates = Object.values( RecordingListSortState )

		this.sortToggle = new UISwitchGroup(
			this.helper,
			this.sortStates,
			{
				onClick: this.onSortSwitchClick
			},
			[ 0 ],
			false
		)

		this.sortBlock = el( `div`, [ new UIText( this.helper, `Sort list by:` ), this.sortToggle ] )
		
		this.list = new UIList( this.helper, UIListItemAnnotatedLabel )

		this.emptyList = new UIText( this.helper, `You have no recordings on this device.` )

		this.base = el( `div`, [
			this.newRecording,
			this.bubbles[ Bubble.addRecordingButton ],
			this.emptyList,
			this.bubbles[ Bubble.recordingItemList ]
		] )

		this.el = new UIViewBase(
			this.helper,
			`Switch to stream list`,
			menuURL,
			{ gotoMenuURL: this.handler.gotoListenList } )

		this.el.update( { content: [ this.base ], bubbles: this.bubbles } )

		this.helper.setCss( this.el.el, this, CssClass.uiViewRecordingList )

		this.helper.setCss( this.sortBlock, this, CssClass.uiViewRecordingListSort )

		this.helper.setCss( this.emptyList.el, this, CssClass.uiViewRecordingListEmpty )
	}

	private buildBubbles()
	{
		return [
			// addRecordingButton
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `Generates a new recording item and navigates to the new recording's page.` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `Recordings enable you to capture audio and live stream to others.` )  ] ),

			// recordingItemList
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `This list displays the recordings available on this device.` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `On the left is the recording link and name:` ),
					el( `br` ),
					new UIText( this.helper, `The item link and added date is at the top, e.g.: ` ),
					new UILink( this.helper, `#`, `16/05/2021, 2:39:16 pm`, { onLinkClick: () => void {} } ),
					el( `br` ),
					new UIText( this.helper, `The item's name underneath, e.g.: Recording from 16/05/2021, 2:39:16 pm` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `On the right is the recording state:` ),
					el( `br` ),
					new UIText( this.helper, `The item isn't recording audio: ` ),
					new UILabel(
						this.helper,
						this.labelColor( RecordingState.notRecording ),
						this.labelText( RecordingState.notRecording ) ),
					el( `br` ),
					new UIText( this.helper, `The item is recording audio: ` ),
					new UILabel(
						this.helper,
						this.labelColor( RecordingState.recording ),
						this.labelText( RecordingState.recording ) )
				] )
		]
	}

	private onSortSwitchClick( index: number )
	{
		if ( this.sortStates[ index ] === this.currentSortState ) return

		this.currentSortState = this.sortStates[ index ] 

		this.sortToggle.update( [ index ] )

		this.list.update( { ordering: this.orderings[ this.currentSortState ] } )
	}

	private labelText( state: RecordingState )
	{
		return state === RecordingState.recording ? `Recording` : `Not recording`
	}

	private labelColor( state: RecordingState )
	{
		return state === RecordingState.recording ? UILabelColor.red : UILabelColor.grey
	}

	private label( state: RecordingState )
	{
		const label = new UILabel( this.helper, this.labelColor( state ), this.labelText( state ) )

		this.helper.setCss( label.el, this, CssClass.uiViewRecordingListAnnot )

		return label
	}

	private sortDate()
	{
		this.orderings[ RecordingListSortState.date ] = Object.values( this.items )
			.sort( ( a, b ) => b.date.getTime() - a.date.getTime() )
			.map( item => item.link.toString() )

		return this
	}

	private sortLabel()
	{
		this.orderings[ RecordingListSortState.label ] = Object.values( this.items )
			.sort( ( a, b ) => a.label.localeCompare( b.label ) || b.date.getTime() - a.date.getTime() )
			.map( item => item.link.toString() )

		return this
	}

	private sortState()
	{
		this.orderings[ RecordingListSortState.state ] = Object.values( this.items )
			.sort( ( a, b ) => a.state === b.state 
				? b.date.getTime() - a.date.getTime() 
				: a.state === RecordingState.recording ? -1 : 1 )
			.map( item => item.link.toString() )

		return this
	}

	private add( item: UIRecordingListItem )
	{
		const id = item.link.toString()

		if ( this.items[ id ] ) return

		const annotation = this.label( item.state )

		this.items[ id ] = { ...item, stateUI: annotation }

		this.sortDate().sortLabel().sortState()

		this.list.update( { 
			item: { 
				id, 
				data:
				{
					annotation,
					linkHREF: id,
					linkText: item.date.toLocaleString(),
					subtext: item.label,
					gotoItem: this.handler.gotoRecordingItem
				} 
			},
			ordering: this.orderings[ this.currentSortState ] } )

		if ( this.listIsEmpty )
		{
			this.listIsEmpty = false

			mount( this.base, this.sortBlock, this.emptyList, true )

			mount( this.base, this.list, this.bubbles[ Bubble.recordingItemList ] )
		}
	}

	private updateItem( link: URL, label?: string, state?: RecordingState )
	{
		const id = link.toString()
		
		if ( !this.items[ id ] ) return

		if ( label !== undefined )
		{
			this.items[ id ].label = label

			this.sortLabel()
		}

		if ( state !== undefined )
		{
			this.items[ id ].state = state

			this.items[ id ].stateUI.update( { 
				color: this.labelColor( state ), 
				text: this.labelText( state ) } )

			this.sortState()
		}

		this.list
			.update( {
				update: {
					id,
					data:
					{
						linkHREF: id,
						linkText: this.items[ id ].date.toLocaleString(),
						subtext: this.items[ id ].label
					}
				} } )
			.update( { ordering: this.orderings[ this.currentSortState ] } )
	}

	private removeItem( link: URL )
	{
		const id = link.toString()
		
		if ( !this.items[ id ] ) return

		delete this.items[ id ]

		this.sortDate().sortLabel().sortState()

		this.list.update( { 
			remove: id,
			ordering: this.orderings[ this.currentSortState ] } )
	}

	public update( { item, updateLabel, updateState, remove, setAddRecordingState, ...base }: UIViewRecordingListUpdateData ): this
	{
		if ( remove ) this.removeItem( remove )

		if ( item ) this.add( item )

		if ( updateLabel ) this.updateItem( updateLabel.link, updateLabel.label )

		if ( updateState ) this.updateItem( updateState.link, undefined, updateState.state )

		if ( setAddRecordingState !== undefined && setAddRecordingState !== this.newLoadingState )
		{
			this.newLoadingState = setAddRecordingState

			if ( this.newLoadingState )
			{
				mount( this.base, this.newRecordingLoader, this.newRecording, true )
			}
			else
			{
				mount( this.base, this.newRecording, this.newRecordingLoader, true )
			}
		}

		this.el.update( base )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiViewRecordingList: {},
			uiViewRecordingListSort: {
				marginTop: `1.5rem`,
				marginBottom: `1rem`,
				'& > *:first-child': {
					display: `block`,
					marginBottom: `0.5rem`
				}
			},
			uiViewRecordingListAnnot: {
				whiteSpace: `nowrap`
			},
			uiViewRecordingListEmpty: {
				marginTop: `1.5rem`,
				display: `block`
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}