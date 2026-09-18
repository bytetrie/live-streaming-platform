import type { Styles } from "jss"
import { el, mount, RedomComponent } from "redom"
import { UIButton } from "./uiButton"
import { UITextEditable } from "./uiTextEditable"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UIList } from "./uiList"
import { UIListenControls, UIListenControlsHandler, UIListenControlsUpdateData } from "./uiListenControls"
import { UIText } from "./uiText"
import { UIViewBase, UIViewBaseUpdateData } from "./uiViewBase"
import { UIListItemToggle, UIListItemToggleData } from "./uiListItemToggle"
import { UISwitchGroup } from "./uiSwitchGroup"
import { UITextCopy } from "./uiTextCopy"
import { BubbleCaret, UIHelpBubble } from "./uiHelpBubble"
import { UILink } from "./uiLink"

enum CssClass
{
	uiViewListenItem = `uiViewListenItem`,
	uiViewListenItemControls = `uiViewListenItemControls`,
	uiViewListenItemType = `uiViewListenItemType`,
	uiViewListenItemLabel = `uiViewListenItemLabel`,
	uiViewListenItemShare = `uiViewListenItemShare`,
	uiViewListenItemOptions = `uiViewListenItemOptions`,
	uiViewListenItemList = `uiViewListenItemList`,
}

export interface UIViewListenItemHandler extends UIListenControlsHandler
{
	/**
	 * Set current listen item label to given value
	 */
	onListenItemLabelChanged: ( label: string ) => void
	/**
	 * User request output state change for current listen item
	 */
	requestOutputStateChange: ( id: string, state: OutputState ) => void
	/**
	 * Go to list for adding streams to the current group
	 * - buttons don't contain link destination
	 */
	gotoAddStreamsToGroup?: ( linkHREF: string ) => void
	/**
	 * Go to list for editing streams to the current group
	 * - buttons don't contain link destination
	 */
	gotoEditStreamsForGroup?: ( linkHREF: string ) => void
	/**
	 * Go to list of listen items
	 */
	gotoListenList: ( linkHREF: string ) => void
	/**
	 * Go to recording item associated with this stream
	 * (only if applicable)
	 */
	gotoRecordingItem: ( linkHREF: string ) => void
}

export interface UIListenItemOutput
{
	id: string
	label: string
}

enum ListenItemType
{
	mine = `Your recording`,
	shared = `Shared with you`,
	group = `Group`
}

enum OutputState
{
	muted = `Muted`,
	active = `Active`
}

interface UIListenItemOutputInternal extends UIListenItemOutput
{
	toggle: UISwitchGroup
	currentOutputState: OutputState
}

export interface UIViewListenItemUpdateData extends UIViewBaseUpdateData
{
	label?: string
	outputItem?: UIListenItemOutput
	outputState?: {id: string, state: OutputState}
	outputLabel?: {id: string, label: string}
	updateControls?: UIListenControlsUpdateData
}

enum Bubble
{
	player,
	type,
	label,
	outputs,
	url,
	addGroupBtn,
	editGroupBtn
}

export class UIViewListenItem implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: UIViewBase

	public classes?: Record<CssClass, string>

	private base: HTMLElement

	private type: UIText

	private label: UITextEditable

	private listenControls: UIListenControls

	// private manageOutputs: UIButton

	private list: UIList<UIListItemToggleData>

	private items: Record<string, UIListenItemOutputInternal>

	private ordering: string[]

	private outputStates: OutputState[]

	private url: UITextCopy

	private addStreams?: UIButton

	private editStreams?: UIButton

	private extraInfo: HTMLElement

	private outputPlaceholder: UIText

	private bubbles: UIHelpBubble[]

	private recordingLink: UILink[]

	constructor(
		private helper: UIMetaHelper,
		private handler: UIViewListenItemHandler,
		menuURL: string,
		type: ListenItemType,
		publicURL: string,
		shareURL: string,
		created: Date,
		adminURL?: string )
	{
		this.id = `UIViewListenItem`

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.onToggle = this.onToggle.bind( this )

		this.bubbles = this.buildBubbles()

		this.items = {}
		
		this.ordering = []

		this.outputStates = Object.values( OutputState )

		this.listenControls = new UIListenControls( this.helper, this.handler )

		this.type = new UIText( this.helper, `${type} - ${created.toLocaleString()}` )

		this.recordingLink = ( type !== ListenItemType.mine || !adminURL ) ? [] : [
			new UILink(
				this.helper,
				`#`,
				`Record to this stream`,
				{ onLinkClick: () => this.handler.gotoRecordingItem( adminURL ) } ) ]

		this.label = new UITextEditable(
			this.helper,
			`Stream added ${( new Date() ).toLocaleString()}`,
			{ onTextChanged: this.handler.onListenItemLabelChanged } )

		// this.manageOutputs = new UIButton( this.helper, `Manage audio outputs` )

		this.list = new UIList( this.helper, UIListItemToggle )

		this.url = new UITextCopy( this.helper, shareURL )

		if ( type === ListenItemType.group )
		{
			this.addStreams = new UIButton(
				this.helper,
				`Add streams to group`,
				{ onClick: () => this.handler.gotoAddStreamsToGroup?.( publicURL ) } )

			this.editStreams = new UIButton(
				this.helper,
				`View and edit group streams`,
				{ onClick: () => this.handler.gotoEditStreamsForGroup?.( publicURL ) } )
		}

		const extraInfo: RedomComponent[] = [
			...this.recordingLink,
			new UIText( this.helper, `Stream public URL (share with others)` ),
			this.url,
			this.bubbles[ Bubble.url ],
			// this.manageOutputs,
		]

		if ( this.addStreams )
		{
			extraInfo.push( this.addStreams )

			extraInfo.push( this.bubbles[ Bubble.addGroupBtn ] )
		}

		if ( this.editStreams )
		{
			extraInfo.push( this.editStreams )

			extraInfo.push( this.bubbles[ Bubble.editGroupBtn ] )
		}

		this.extraInfo = el( `div`, extraInfo )

		this.outputPlaceholder = new UIText( this.helper, `Press play to activate output controls.` )

		this.base = el( `div`, [
			this.listenControls,
			this.bubbles[ Bubble.player ],
			this.type,
			this.bubbles[ Bubble.type ],
			this.bubbles[ Bubble.label ],
			this.label,
			this.extraInfo,
			this.outputPlaceholder,
			this.bubbles[ Bubble.outputs ]
		] )

		this.el = new UIViewBase(
			this.helper,
			`View stream list`,
			menuURL,
			{ gotoMenuURL: this.handler.gotoListenList } )

		this.el.update( { content: [ this.base ], bubbles: this.bubbles } )

		this.helper.setCss( this.el.el, this, CssClass.uiViewListenItem )

		this.helper.setCss( this.listenControls.el, this, CssClass.uiViewListenItemControls )

		this.helper.setCss( this.type.el, this, CssClass.uiViewListenItemType )

		this.helper.setCss( this.label.el, this, CssClass.uiViewListenItemLabel )

		this.helper.setCss( this.url.el, this, CssClass.uiViewListenItemShare )

		this.helper.setCss( this.extraInfo, this, CssClass.uiViewListenItemOptions )

		this.helper.setCss( this.list.el, this, CssClass.uiViewListenItemList )

		this.helper.setCss( this.outputPlaceholder.el, this, CssClass.uiViewListenItemList )
	}

	private buildBubbles()
	{
		return [
			// player
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `Click "Play" to start randomised playback.` ),
					el( `br` ),
					new UIText( this.helper, `Ensure outputs below are set to "Active."` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `Audio might not be available immediately, please wait a moment.` ),
					el( `br` ),
					new UIText( this.helper, `Audio can be quiet or loud, please check your device volume levels.` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `
						Randomised audio means the playback is not linear, as it was recorded. 
						This aesthetic and functional choice frees individual and collaborative 
						compositions from the imposition of structure and duration.
					` ),
				] ),

			// type
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `Indicates the type of stream.` ),
					el( `br` ),
					new UIText( this.helper, `${ListenItemType.mine}: stream was recorded from this device.` ),
					el( `br` ),
					new UIText( this.helper, `${ListenItemType.shared}: stream was added via a link.` ),
					el( `br` ),
					new UIText( this.helper, `${ListenItemType.group}: collection of streams for collaboration.` )
				] ),

			// label
			new UIHelpBubble(
				this.helper,
				[
					new UIText( this.helper, `You can change the name of the stream by clicking on this text.` ),
					el( `br` ),
					new UIText( this.helper, `This name is only used on this device.` )
				],
				BubbleCaret.downLeft ),

			// outputs
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `Each output corresponds to the available audio output device's channels.` ),
					el( `br` ),
					new UIText( this.helper, `Set the toggles to "Active" to hear audio for this stream:` ),
					el( `br` ),
					new UISwitchGroup(
						this.helper,
						Object.values( OutputState ),
						{ onClick: () => void {} },
						[ 1 ],
						false
					)
				] ),

			// url
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `This URL can be used for sharing the stream with others.` )
				] ),

			// addGroupBtn
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `View streams that can be added to this group.` ),
					el( `br` ),
					new UIText( this.helper, `Anyone with access to this group can add streams to it.` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `
						When a stream is added to a group, it can be played by anyone 
						with access to this group. When you click "Play" above, the 
						group will randomly select and return a stream from all streams
						added to it.` ),
				] ),

			// editGroupBtn
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `View and remove streams added to the group from this device.` )
				] ),

		]
	}

	private sortLabel()
	{
		this.ordering = Object.values( this.items )
			.sort( ( a, b ) => a.label.localeCompare( b.label ) )
			.map( item => item.id )

		return this
	}

	private onToggle( id: string, stateIndex: number )
	{
		const state = this.outputStates[ stateIndex ]

		this.items[ id ].currentOutputState = state

		this.items[ id ].toggle.update( [ stateIndex ] )

		this.handler.requestOutputStateChange( id, state )
	}

	private add( { id, label }: UIListenItemOutput )
	{
		if ( this.items[ id ] ) return

		const toggle = new UISwitchGroup( 
			this.helper,
			this.outputStates,
			{ onClick: selectedIndex => this.onToggle( id, selectedIndex ) },
			[ 0 ] )

		this.items[ id ] = { id, label, toggle, currentOutputState: OutputState.muted }

		this.sortLabel()

		this.list.update( {
			item: {
				id, 
				data: { label, toggle } 
			},
			ordering: this.ordering } )

		if ( Object.keys( this.items ).length === 1 )
		{
			mount( this.base, this.list, this.outputPlaceholder, true )
		}
	}

	public update( { outputItem, label, outputState, outputLabel, updateControls, ...base }: UIViewListenItemUpdateData ): this
	{
		if ( label !== undefined ) this.label.update( label )

		if ( outputItem ) this.add( outputItem )

		if ( outputState && this.items[ outputState.id ] && outputState.state !== this.items[ outputState.id ].currentOutputState )
		{
			this.items[ outputState.id ].currentOutputState = outputState.state

			this.items[ outputState.id ].toggle.update( [ 
				this.outputStates.findIndex( i => i === outputState.state )
			] )
		}

		if ( outputLabel && this.items[ outputLabel.id ] )
		{
			this.items[ outputLabel.id ].label = outputLabel.label

			this.sortLabel()

			this.list.update( {
				update: { id: outputLabel.id, data: { label: outputLabel.label } },
				ordering: this.ordering
			} )
		}

		if ( updateControls ) this.listenControls.update( updateControls )

		this.el.update( base )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiViewListenItem: {},
			uiViewListenItemControls: {},
			uiViewListenItemLabel: {
				maxWidth: `50ch`
			},
			uiViewListenItemType: {
				display: `block`,
				marginBottom: `0.5rem`,
				marginTop: `1rem`
			},
			uiViewListenItemOptions: {
				'& > a': {
					display: `block`,
					marginBottom: `0.5rem`
				},
				'& > span': {
					display: `block`,
					marginBottom: `0.2rem`
				},
				'& > button': {
					display: `block`,
					marginTop: `1.5rem`
				}
			},
			uiViewListenItemList: {
				display: `block`,
				marginTop: `1.5rem !important`
			},
			uiViewListenItemShare: {
				maxWidth: `25rem`
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}