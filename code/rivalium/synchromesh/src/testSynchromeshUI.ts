import type { Styles } from "jss"
import { el, mount, RedomComponent, setChildren } from "redom"
import { AnimatedRectangleType, UIAnimatedRectangle } from "./uiAnimatedRectangle"
import { UIAudioPlayer, UIAudioPlayerState } from "./uiAudioPlayer"
import { UIButton } from "./uiButton"
import { UITextCopy } from "./uiTextCopy"
import { UITextEditable } from "./uiTextEditable"
import { UIHeader } from "./uiHeader"
import { StyleVars, UIMetaHelper, UIMetaHelperHandler } from "./uiMetaHelper"
import { UILabel, UILabelColor } from "./uiLabel"
import { UILink } from "./uiLink"
import { UIList } from "./uiList"
import { UIListItemAnnotatedLabel } from "./uiListItemAnnotatedLabel"
import { UILoadingMessage } from "./uiLoadingMessage"
import { UIRecordingState } from "./uiRecordingState"
import { UIMetaRoot } from "./uiMetaRoot"
import { UIStreamURLs } from "./uiStreamURLs"
import { UISwitchGroup } from "./uiSwitchGroup"
import { UIText } from "./uiText"
import { UITextInput } from "./uiTextInput"
import { UIViewSourceList } from "./uiViewSourceList"
import { UIViewRecordingItem } from "./uiViewRecordingItem"
import { UIRecordingListItem, UIViewRecordingList } from "./uiViewRecordingList"
import { UIListItemSourceMonitor } from "./uiListItemSourceMonitor"
import { UIViewSourceItem } from "./uiViewSourceItem"
import { UIViewListenItem } from "./uiViewListenItem"
import { ListenState, UIListenControls } from "./uiListenControls"
import { UIListItemToggle } from "./uiListItemToggle"
import { UIListenListItem, UIViewListenList } from "./uiViewListenList"
import { UIListItemLink } from "./uiListItemLink"
import { UIGroupAddItem, UIViewGroupAddStreams } from "./uiViewGroupAddStreams"
import { UIGroupEditItem, UIViewGroupEditStreams } from "./uiViewGroupEditStreams"
import { UIMetaViewManager, View } from "./uiMetaViewManager"
import { UIViewLoading } from "./uiViewLoading"
import { BubbleCaret, UIHelpBubble } from "./uiHelpBubble"

interface UIItem
{
	component: RedomComponent | HTMLElement
	name: string
	inverted?: boolean
}

enum ListenItemType
{
	mine = `Your recording`,
	shared = `Shared with you`,
	group = `Group`
}

enum RecordingState
{
	notRecording = `Not recording`,
	recording = `Recording`
}

enum OutputState
{
	muted = `Muted`,
	active = `Active`
}

enum CssClass
{
	uiRoot = `uiRoot`,
	uiComponentList = `uiComponentList`,
	uiComponentBlock = `uiComponentBlock`,
	uiComponentBlockInverted = `uiComponentBlockInverted`,
	uiSidebar = `uiSidebar`,
	uiHeader = `uiHeader`,
	styleVar = `styleVar`,
	uiSpacer = `uiSpacer`,
	uiViewWrapper = `uiViewWrapper`,
	rectangle = `rectangle`
}

export class TestSynchromeshUI 
implements
	UI.Styled<CssClass>,
	UIMetaHelperHandler
{
	private helper: UIMetaHelper

	private mountEl: UIMetaRoot

	private componentsList: HTMLElement

	private elements: UIItem[]

	private sidebar: {main: HTMLElement, top: HTMLElement, bottom: HTMLElement}

	private header: HTMLElement

	private vars: Record<string, HTMLElement>

	private listItems: string[]

	private volumeCallbacks: ( ( volume: number ) => void )[]

	private volumeRunning: boolean

	public classes?: Record<CssClass, string>

	public id: string

	constructor( mountSelector: string )
	{
		this.id = `TestSynchromeshUI` 

		this.vars = {}

		this.volumeRunning = false

		this.helper = new UIMetaHelper( this )

		this.helper.getCSSClasses( this )

		this.onMenuBtnClick = this.onMenuBtnClick.bind( this )

		this.updateStyleVar = this.updateStyleVar.bind( this )

		this.sidebar = this.createSidebar()

		this.header = this.createHeader()

		this.componentsList = el( `div` )

		this.helper.setCss( this.componentsList, this, CssClass.uiComponentList )

		this.mountEl = new UIMetaRoot( this.helper, mountSelector )

		this.helper.setCss( this.mountEl.el, this, CssClass.uiRoot )

		setChildren( this.mountEl, [ this.sidebar.main, this.header, this.componentsList ] )

		this.listItems = []

		this.volumeCallbacks = []

		this.elements = [
			{
				component: new UIButton( this.helper, `button` ),
				name: `Button`
			},
			{
				component: new UIText( this.helper, `Wow, look at this text! The quick brown fox jumps over the lazy dog.` ),
				name: `Text`
			},
			{
				component: new UIText( this.helper, `Wow, look at this text! The quick brown fox jumps over the lazy dog.`, true ),
				name: `Text Inverted`,
				inverted: true,
			},
			{
				component: new UIHeader( 
					this.helper,
					`Menu`,
					`#`,
				),
				name: `Header`
			},
			{
				component: el( `p`, [ 
					new UILink( this.helper, `#${Math.random()}`, `This is a standard link.` ),
					` `,
					new UILink( this.helper, `#`, `This is a visited link.` ) ] ),
				name: `Link`
			},
			{
				component: el( `p`, [ 
					new UILink( this.helper, `#${Math.random()}`, `This is a standard link.`, undefined, true ),
					` `,
					new UILink( this.helper, `#`, `This is a visited link.`, undefined, true ) ] ),
				name: `Link Inverted`,
				inverted: true
			},
			{
				component: this.linkListItem(),
				name: `Link List item`
			},
			{
				component: this.annotatedLabelListItem(),
				name: `Annotated Label List item`
			},
			{
				component: this.sourceMonitorListItem(),
				name: `Source Monitor List item`
			},
			{
				component: this.toggleListItem(),
				name: `Toggle List item`
			},
			{
				component: this.exampleList(),
				name: `List`
			},
			{
				component: el( `div`, [
					new UITextInput( this.helper ),
					this.space(),
					new UITextInput( this.helper, undefined, `A clever placeholder...` ),
					this.space(),
					new UITextInput( this.helper, undefined, `This one has an error!` ).update( { hasError: true } )
				] ),
				name: `Text Input`
			},
			{
				component: this.createSwitches(),
				name: `Switch group`
			},
			{
				component: new UITextCopy( this.helper, `Some text to copy` ),
				name: `Copy Text`
			},
			{
				component: this.createEditable(),
				name: `Editable text`
			},
			{
				component: el( `div`, [
					this.createAnimatedRectangle(),
					this.space(),
					this.createAnimatedRectangle( AnimatedRectangleType.striped ),
				] ),
				name: `Animated Rectangle`
			},
			{
				component: el( `div`, [
					this.createAudioPlayer(),
					this.space(),
					this.createAudioPlayer( UIAudioPlayerState.progress ),
					this.space(),
					this.createAudioPlayer( UIAudioPlayerState.random ),
					this.space(),
					this.createAudioPlayer( UIAudioPlayerState.live ),
					this.space(),
					this.createAudioPlayer( UIAudioPlayerState.buffering ),
				] ),
				name: `Audio player`
			},
			{
				component: new UILoadingMessage( this.helper, `Loading` ),
				name: `Loading message`
			},
			{
				component: el( `div`, [
					new UILabel( this.helper, UILabelColor.grey, `Some label grey` ),
					this.space(),
					new UILabel( this.helper, UILabelColor.red, `Some label red` ),
					this.space(),
					new UILabel( this.helper, UILabelColor.blue, `Some label blue` )
				] ),
				name: `Label`
			},
			{
				component: new UIStreamURLs( this.helper, `https://example.com/123/456`, `https://example.com/abc/def` ),
				name: `Stream URLs`
			},
			{
				component: this.recordingState(),
				name: `Recording state`
			},
			{
				component: this.listenControls(),
				name: `Listen controls`
			},
			{
				component: this.helpBubble(),
				name: `Help Bubble`
			},
			{
				component: this.recordingItemView(),
				name: `View: Recording Item`
			},
			{
				component: this.recordingListView(),
				name: `View: Recording List`
			},
			{
				component: this.manageSourceView(),
				name: `View: Manage Audio Sources`
			},
			{
				component: this.inputChannelView(),
				name: `View: Manage Input Channel`
			},
			{
				component: this.listenItemView(),
				name: `View: Listen Item`
			},
			{
				component: this.listenListView(),
				name: `View: Listen List`
			},
			{
				component: this.groupAddView(),
				name: `View: Group add stream`
			},
			{
				component: this.groupEditView(),
				name: `View: Group edit stream`
			},
			{
				component: this.loadingView(),
				name: `View: Loading`
			},
			{
				component: this.manageViews(),
				name: `Meta: view manager`
			}
		]

		this.mountElements()
	}

	private manageViews()
	{
		const navigationURL = new URL( window.location.href )

		const id = `123`

		let itemPlaying = false

		const gotoListenItem = () =>
		{
			manager
				.update( { setView: { 
					view: View.listenItem,
					navigationURL,
					id,
					publicURL: navigationURL,
					type: ListenItemType.group,
					shareURL: `test.com`,
					created: new Date() } } )
				.update( { listenItemUpdate: { id, data: {
					outputItem: { id, label: `Output 1` }
				} } } )
		}

		const gotoRecordingItem = () =>
		{
			manager.update( { setView: { 
				view: View.recordingItem,
				navigationURL,
				id,
				created: new Date() } } )
		}

		const manager = new UIMetaViewManager( this.helper, {
			// Recording item
			requestCreateRecordingEndpoint: () =>
			{
				manager.update( { recordingItemUpdate: { id, data: {
					cloudData: { 
						publicShareURL: navigationURL.toString(),
						adminShareURL: navigationURL.toString(), 
						publicURL: navigationURL } } } } )
			},
			onRecordingItemLabelChanged: label =>
			{
				manager.update( { recordingItemUpdate: { id, data: { label } } } )
			},
			gotoManageAudioSource: () =>
			{
				manager.update( { setView: {
					view: View.sourceList,
					navigationURL
				} } )
			},
			requestRecordingStateChange: recordingState =>
			{
				manager.update( { recordingItemUpdate: { id, data: { updateRecordingState: { recordingState } } } } )
			},
			// Manage audio sources
			requestActivateInputDevice: () =>
			{
				manager.update( { sourceListUpdate: { audioDeviceActive: true, item: { label: `Input `, link: navigationURL } } } )
			},
			requestDeactivateInputDevice: () =>
			{
				manager.update( { sourceListUpdate: { audioDeviceActive: false } } )
			},
			requestChangeSelectedAudioInputSourceForRecording: () =>
			{
				manager
					.update( { sourceListUpdate: { selected: navigationURL } } )
					.update( { recordingItemUpdate: { id, data: { updateRecordingState: {
						hasSource: true,
						recordingState: RecordingState.notRecording,
						volume: 0.5 } } } } )
			},
			// Add streams to group
			requestAddStreamToGroup: () => void {},
			// Edit group streams
			requestRemoveStreamFromGroup: () => void {},
			// Listen list
			requestCreateNewGroup: gotoListenItem,
			// Recording list
			requestCreateNewRecording: gotoRecordingItem,
			// Listen item
			onListenItemLabelChanged: label =>
			{
				manager.update( { listenItemUpdate: { id, data: { label } } } )
			},
			requestOutputStateChange: ( id: string, state: OutputState ) =>
			{
				manager.update( { listenItemUpdate: { id, data: { outputState: { id, state } } } } )
			},
			gotoAddStreamsToGroup: () =>
			{
				manager.update( { setView: {
					view: View.listenAdd,
					navigationURL,
					items: []
				} } )
			},
			gotoEditStreamsForGroup: () =>
			{
				manager.update( { setView: {
					view: View.listenEdit,
					navigationURL,
					items: []
				} } )
			},
			requestListenStateChange: state =>
			{
				manager.update( { listenItemUpdate: { id, data: { updateControls: { 
					listenState: state,
					noData: false,
					buffering: false } } } } )
			},
			requestPlayingStateToggle: () =>
			{
				itemPlaying = !itemPlaying

				manager.update( { listenItemUpdate: { id, data: { updateControls: { playing: itemPlaying } } } } )
			},
			gotoListenItem: gotoListenItem,
			gotoGroup: gotoListenItem,
			gotoListenList: () =>
			{
				manager.update( { setView: { view: View.listenList, navigationURL } } )
			},
			gotoRecordingItem: gotoRecordingItem,
			gotoRecordingList: () =>
			{
				manager.update( { setView: { view: View.recordingList, navigationURL } } )
			},
			onSourceItemLabelChanged: label =>
			{
				manager.update( { sourceItemUpdate: { id, data: { label } } } )
			},
			onMonitoringSourceItemStateChanged: monitorState =>
			{
				manager.update( { sourceItemUpdate: { id, data: { monitorState } } } )
			},
			gotoSourceList: () =>
			{
				manager.update( { setView: {
					view: View.sourceList,
					navigationURL
				} } )
			},
			gotoSourceItem: () => void {},
			onViewFirstLoad: () => void {}
		} )

		manager.update( { setView: { view: View.recordingList, navigationURL } } )

		return this.createViewWrapper( manager )
	}

	private loadingView()
	{
		return this.createViewWrapper( new UIViewLoading( this.helper ) )
	}

	private groupEditView()
	{
		const items: UIGroupEditItem[] = Array( 10 ).fill( undefined ).map( () =>
		{
			const ran = Math.random()

			const ran2 = Math.random()

			const r = `${ran}`.slice( 2 )

			const item: UIGroupEditItem = {
				label: `Stream ${r}`,
				created: new Date(),
				group: new URL( `/#`, window.origin ),
				link: new URL( `https://example.com/123/${r}` ),
				type: ran2 > 0.67
					? ListenItemType.group
					: ran2 > 0.34
						? ListenItemType.shared
						: ListenItemType.mine,
				external: ran > 0.5
			}

			return item
		} )

		const view = new UIViewGroupEditStreams( 
			this.helper,
			{
				requestRemoveStreamFromGroup: ( _: URL, stream: URL ) =>
				{
					setTimeout( () => view.update( { removed: stream.toString() } ), 500 )
				},
				gotoGroup: () => void {},
				gotoListenItem: () => void {}
			},
			`#`,
			items
		)

		return this.createViewWrapper( view )
	}

	private groupAddView()
	{
		const items: UIGroupAddItem[] = Array( 10 ).fill( undefined ).map( () =>
		{
			const ran = Math.random()

			const ran2 = Math.random()

			const r = `${ran}`.slice( 2 )

			const item: UIGroupAddItem = {
				label: `Stream ${r}`,
				created: new Date(),
				link: new URL( `https://example.com/123/${r}` ),
				type: ran2 > 0.67
					? ListenItemType.group
					: ran2 > 0.34
						? ListenItemType.shared
						: ListenItemType.mine
			}

			return item
		} )

		const view = new UIViewGroupAddStreams( 
			this.helper,
			{
				requestAddStreamToGroup: ( stream: URL ) =>
				{
					setTimeout( () => view.update( { added: stream.toString() } ), 500 )
				},
				gotoGroup: () => void {},
				gotoListenItem: () => void {}
			},
			`#`,
			items
		)

		return this.createViewWrapper( view )
	}

	private listenListView()
	{
		const items: UIListenListItem[] = [] 

		const view = new UIViewListenList( 
			this.helper,
			{
				requestCreateNewGroup: () =>
				{
					const ran = Math.random()

					const ran2 = Math.random()

					const r = `${ran}`.slice( 2 )

					const item: UIListenListItem = {
						label: `Stream ${r}`,
						created: new Date(),
						link: new URL( `https://example.com/123/${r}` ),
						playing: false,
						type: ran2 > 0.67
							? ListenItemType.group
							: ran2 > 0.34
								? ListenItemType.shared
								: ListenItemType.mine
					}

					items.push( item )

					view.update( { item } )

					if ( ran > 0.5 )
						view.update( { 
							updatePlaying: {
								link: item.link, 
								playing: true } } )
				},
				gotoRecordingList: () => void {},
				gotoListenItem: () => void {}
			},
			`#`
		)

		return this.createViewWrapper( view )
	}

	private listenItemView()
	{
		let playing = false

		const view = new UIViewListenItem( 
			this.helper,
			{
				onListenItemLabelChanged: label =>
				{
					view.update( { label } )
				},
				requestListenStateChange: state =>
				{
					view.update( { updateControls: { listenState: state } } )

					switch( state )
					{
						case ListenState.live:

						case ListenState.random:

							view.update( { updateControls: { noData: false } } )

							break

						case ListenState.normal:

							view.update( { updateControls: { currentSeconds: 0, totalSeconds: 10 } } )
					}
				},
				requestOutputStateChange: () => void {},
				requestPlayingStateToggle: () =>
				{
					playing = !playing

					view.update( { updateControls: { playing } } )
				},
				gotoAddStreamsToGroup: () => void {},
				gotoEditStreamsForGroup: () => void {},
				gotoListenList: () => void {},
				gotoRecordingItem: () => void {}
			},
			`#`,
			ListenItemType.group,
			`https://example.com/123/456`,
			`test.com/123`,
			new Date()
		)

		view.update( { outputItem: { id: `0`, label: `Channel 0` } } )

		view.update( { outputItem: { id: `1`, label: `Channel 1` } } )

		view.update( { outputState: { id: `0`, state: OutputState.active } } )

		view.update( { updateControls: { noData: false } } )

		return this.createViewWrapper( view )
	}

	private inputChannelView()
	{
		const view = new UIViewSourceItem( this.helper, {
			onSourceItemLabelChanged: label =>
			{
				view.update( { label } )
			},
			onMonitoringSourceItemStateChanged: monitorState =>
			{
				view.update( { monitorState } )
			},
			gotoSourceList: () => void {}
		}, 
		`#`,
		`Channel 1`,
		Array( 5 ).fill( undefined ).map( () => ( {
			date: new Date(),
			label: `Recording ${~~( Math.random() * 1000000 )}`,
			link: new URL( `https://example.com/123/${~~( Math.random() * 1000000 )}` )
		} ) ) )

		this.addVolumeUpdate( volume => view.update( { volume } ) )

		return this.createViewWrapper( view )
	}

	private manageSourceView()
	{
		const view = new UIViewSourceList( 
			this.helper, 
			{
				requestActivateInputDevice: () =>
				{
					const links = [
						new URL( `#`, window.location.origin ),
						new URL( `#1`, window.location.origin ) ]

					view.update( { item: {
						label: `Audio input device channel #0`,
						link: links[ 0 ]
					} } )

					view.update( { item: {
						label: `Audio input device channel #1`,
						link: links[ 1 ]
					} } )

					this.addVolumeUpdate( volume =>
					{
						view.update( { updateVolume: { link: links[ 0 ], volume } } )

						view.update( { updateVolume: { link: links[ 1 ], volume } } )
					} )

					view.update( { audioDeviceActive: true } )
				},
				requestDeactivateInputDevice: () =>
				{
					view.update( { audioDeviceActive: false } )
				},
				requestChangeSelectedAudioInputSourceForRecording: selected =>
				{
					view.update( { selected } )
				},
				gotoRecordingItem: () => void {},
				gotoSourceItem: () => void {}
			}, 
			`#`
		)

		return this.createViewWrapper( view )
	}

	private recordingListView()
	{
		const items: UIRecordingListItem[] = []

		const view = new UIViewRecordingList( 
			this.helper,
			{
				requestCreateNewRecording: () =>
				{
					const r = `${Math.random()}`.slice( 2 )

					const item: UIRecordingListItem = {
						date: new Date(),
						label: `Recording ${r}`,
						link: new URL( `https://example.com/123/${r}` ),
						state: RecordingState.notRecording
					}

					items.push( item )

					view.update( { item } )

					if ( Math.random() > 0.5 )
						view.update( { updateState: {
							link: item.link, 
							state: RecordingState.recording } } )
				},
				gotoListenList: () => void {},
				gotoRecordingItem: () => void {}
			},
			`#` 
		)

		return this.createViewWrapper( view )
	}

	private recordingItemView()
	{
		const url = new URL( `https://example.com/123/456` )

		const view = new UIViewRecordingItem( 
			this.helper,
			{
				gotoManageAudioSource: () => void {},
				requestRecordingStateChange: () => void {},
				requestCreateRecordingEndpoint: () => 
				{
					setTimeout( () => view.update( { cloudData: {
						publicURL: url,
						adminShareURL: url.toString(),
						publicShareURL: url.toString() } } ), 100 )
				},
				onRecordingItemLabelChanged: ( label: string ) =>
				{
					view.update( { label } )
				},
				gotoListenItem: () => void {},
				gotoRecordingList: () => void {}
			},
			`#`,
			new Date()
		)

		view.update( { listenLink: url } )

		return this.createViewWrapper( view )
	}

	private createVolumeLoop()
	{
		let volume = 0

		setInterval( () =>
		{
			volume += ( Math.random() - 0.5 ) * 0.01

			volume = volume < 0 ? 0 : volume > 1 ? 1 : volume

			this.volumeCallbacks.forEach( cb => cb( volume ) )
		}, 10 )

		this.volumeRunning = true
	}

	private addVolumeUpdate( fn: ( volume: number ) => void )
	{
		this.volumeCallbacks.push( fn )

		if ( !this.volumeRunning ) this.createVolumeLoop()
	}

	private listenControls()
	{
		let playing = false

		const block = new UIListenControls( this.helper, {
			requestPlayingStateToggle: () =>
			{
				playing = !playing

				block.update( { playing } )
			},
			requestListenStateChange: state =>
			{
				block.update( { listenState: state } )

				switch( state )
				{
					case ListenState.live:

					case ListenState.random:

						block.update( { noData: false } )

						break

					case ListenState.normal:

						block.update( { currentSeconds: 0, totalSeconds: 10 } )
				}
				
			}
		} )

		block.update( { currentSeconds: 0, totalSeconds: 10 } )

		return block
	}

	private helpBubble()
	{
		const block = new UIHelpBubble( this.helper, undefined, BubbleCaret.downRight )

		block
			.update( { content: [ 
				new UIText( this.helper, `Some content` ),
				this.space(),
				new UIButton( this.helper, `Some button` ) ] } )
			.update( { visible: true } )

		return block
	}

	private recordingState()
	{
		const block = new UIRecordingState( this.helper, {
			gotoManageAudioSource: () =>
			{
				block.update( { hasSource: true } )

				this.addVolumeUpdate( volume => block.update( { volume } ) )
			},
			requestRecordingStateChange: state =>
			{
				console.log( state )
			}
		} )

		return block
	}

	private createViewWrapper( children: HTMLElement | RedomComponent | ( RedomComponent | HTMLElement )[] )
	{
		const view = el( `div`, children )

		this.helper.setCss( view, this, CssClass.uiViewWrapper )

		return view
	}

	private createAnimatedRectangle( type: AnimatedRectangleType = AnimatedRectangleType.grey )
	{
		const rectangle = new UIAnimatedRectangle( this.helper, type, undefined, true )

		if ( !type )
		{
			let time = 100
	
			let typeIndex = 0
	
			const types = Object.values( AnimatedRectangleType ) as AnimatedRectangleType[]
	
			setInterval( () => 
			{
				time = time === 1000 ? 1 : time + 1
	
				const update: {type?: number, value: number} = { value: time * 0.001 }
	
				if ( time % 200 === 0 )
				{	
					typeIndex = typeIndex >= types.length - 1 ? 0 : typeIndex + 1
	
					update.type = types[ typeIndex ]
				}
	
				rectangle.update( update )
			}, 10 )
		}

		const outer = el( `div`, rectangle )

		this.helper.setCss( outer, this, CssClass.rectangle )

		return outer
	}

	private createAudioPlayer( state?: UIAudioPlayerState )
	{
		let playState = false

		let time = 100

		const player = new UIAudioPlayer( this.helper, {
			onTogglePlaying: () => 
			{
				playState = !playState

				player.update( { playing: playState } )
			}
		} )

		if ( state )
		{
			if ( state === UIAudioPlayerState.progress )
			{
				player.update( { state, totalSeconds: 10, currentSeconds: time * 0.01 } )

				setInterval( () => 
				{
					time = time === 1000 ? 1 : time + 1

					player.update( { state, totalSeconds: 10, currentSeconds: time * 0.01 } )
				}, 10 )
			}
			else player.update( { state } )
		}

		return player
	}

	private createEditable()
	{
		const editable = new UITextEditable( 
			this.helper, 
			`This is my cool label text, wow so cool!`,
			{ onTextChanged: text => 
			{
				editable.update( text )
			} }
		)

		return editable
	}

	private createSwitches()
	{
		const aSelected = [ 0 ]

		const a = new UISwitchGroup(
			this.helper, 
			[ `Option 1`, `Option 2`, `Option 3` ], 
			{
				onClick: ( index ) => 
				{
					if ( aSelected.includes( index ) )
					{
						aSelected.splice( 0, 1 )
					}
					else
					{
						aSelected[ 0 ] = index
					}
					
					a.update( aSelected )
				}
			}, aSelected, false )

		const bSelected = [ 0, 1 ]
	
		const b = new UISwitchGroup(
			this.helper, 
			[ `Option 1`, `Option 2`, `Option 3` ], 
			{
				onClick: ( index ) => 
				{
					const i = bSelected.indexOf( index )

					if ( i !== -1 )
					{
						bSelected.splice( i, 1 )
					}
					else
					{
						bSelected.push( index )
					}

					b.update( bSelected )
				}
			}, bSelected, true )
		
		const group = el( `div`, [ a, this.space(), b ] )

		return group
	}

	private space()
	{
		const item = el( `div` )

		this.helper.setCss( item, this, CssClass.uiSpacer )

		return item
	}

	private toggleListItem()
	{
		const li = new UIListItemToggle()

		const toggle = new UISwitchGroup( 
			this.helper,
			[ `Muted`, `Active` ],
			{ onClick: selected => 
			{
				toggle.update( [ selected ] )
			} },
			[ 0 ] )

		// For list item to work with Redom List system
		// Constructor must be empty, and update call provides data for component
		li.update(
			{
				label: `Channel 0`,
				toggle
			},
			0,
			[],
			{ helper: this.helper } )

		return li
	}

	private sourceMonitorListItem()
	{
		const li = new UIListItemSourceMonitor()

		// For list item to work with Redom List system
		// Constructor must be empty, and update call provides data for component
		li.update(
			{
				linkHREF: `#`,
				linkText: `This is an item that will go to Somewhere, over the rainbow.`,
				monitor: new UIAnimatedRectangle( this.helper, AnimatedRectangleType.gradient, 1, false ),
				annotation: new UIButton( this.helper, `Do thing`, {
					onClick: () =>
					{
						li.update( { annotation: new UILabel( this.helper, UILabelColor.blue, `Stuff` ) }, 0, [], { helper: this.helper } )
					}
				} )
			},
			0,
			[],
			{ helper: this.helper } )

		return li
	}

	private linkListItem()
	{
		const li = new UIListItemLink()

		// For list item to work with Redom List system
		// Constructor must be empty, and update call provides data for component
		li.update(
			{
				linkHREF: `#`,
				linkText: `This is an item that will go to Somewhere, over the rainbow.`,
				subtext: `This is a subtext. It can be used to give a longer description.`
			},
			0,
			[],
			{ helper: this.helper } )

		return li
	}

	private annotatedLabelListItem()
	{
		const li = new UIListItemAnnotatedLabel()

		// For list item to work with Redom List system
		// Constructor must be empty, and update call provides data for component
		li.update(
			{
				annotation: new UIText( this.helper, `Annot` ),
				linkHREF: `#`,
				linkText: `This is an item that will go to Somewhere, over the rainbow.`,
				subtext: `This is a subtext. It can be used to give a longer description.`
			},
			0,
			[],
			{ helper: this.helper } )

		return li
	}

	private exampleList()
	{
		const list = new UIList(
			this.helper,
			UIListItemAnnotatedLabel,
			{
				"#0": {
					annotation: new UIText( this.helper, `Annot0` ),
					linkHREF: `#0`,
					linkText: `0 This is an item that will go to Somewhere, over the rainbow.`,
					subtext: `0 This is a subtext. It can be used to give a longer description.`
				}
			},
			[ `#0` ]
		)

		this.listItems.push( `#0`, `#1` ) 

		list
			.update( {
				item: {
					id: `#1`,
					data: {
						annotation: new UIText( this.helper, `Annot1` ),
						linkHREF: `#1`,
						linkText: `1 This is an item that will go to Somewhere, over the rainbow.`,
						subtext: `1 This is a subtext. It can be used to give a longer description.`
					} }
			} )
			.update( { ordering: this.listItems } )

		return el( `div`, [
			new UIButton(
				this.helper,
				`Add item`,
				{ onClick: () => 
				{
					const l = this.listItems.length

					this.listItems.push( `#${l}` )

					list.update( {
						item: {
							id: `#${l}`,
							data: {
								annotation: new UIText( this.helper, `Annot${l}` ),
								linkHREF: `#${l}`,
								linkText: `${l} This is an item that will go to Somewhere, over the rainbow.`,
								subtext: `${l} This is a subtext. It can be used to give a longer description.`
							}
						}
					} )
				} }
			),
			new UIButton(
				this.helper,
				`Sort`,
				{ onClick: () => list.update( { ordering: this.listItems } ) }
			),
			new UIButton(
				this.helper,
				`Filter`,
				{ onClick: () => list.update( { ordering: [ this.listItems[ 0 ], this.listItems[ this.listItems.length - 1 ] ] } ) }
			),
			this.space(),
			list
		] )
	}

	private mountElements()
	{
		for( const { component, name, inverted } of this.elements )
		{
			this.componentBlock( name, name, component, inverted )
		}
	}

	private componentBlock( id: string, title: string, component: RedomComponent | HTMLElement, inverted?: boolean )
	{
		const c = el( `div#${id}`, [
			el( `p`, new UIText( this.helper, title, inverted ) ),
			component
		] )

		this.helper.setCss( c, this, CssClass.uiComponentBlock )

		if ( inverted ) this.helper.setCss( c, this, CssClass.uiComponentBlockInverted )

		mount( this.componentsList, c )

		mount( this.sidebar.top, new UILink( this.helper, `#${id}`, title, undefined, true ) )
	}

	private createSidebar()
	{
		const sb = el( `div` )

		const top = el( `div` )

		const btm = el( `div` )

		setChildren( sb, [ top, btm ] )

		this.helper.setCss( sb, this, CssClass.uiSidebar )

		return { main: sb, top, bottom: btm }
	}

	private createHeader()
	{
		const hd = el( `div`, new UIHeader( this.helper, `Menu`, `#menu`, /*`#`*/ ) )

		this.helper.setCss( hd, this, CssClass.uiHeader )

		return hd
	}

	private updateStyleVar( key: string, value: string )
	{
		this.helper.updateVar( key, value )
	}

	public onUpdateStyleVars( vars: StyleVars ): void
	{
		const keys = Object.keys( vars ).sort()

		for ( let i = 0; i < keys.length; i++ )
		{
			if ( !this.vars[ keys[ i ] ] )
			{
				this.vars[ keys[ i ] ] = el( `div`, [
					new UIText( this.helper, keys[ i ], true ),
					new UITextInput( this.helper, vars[ keys[ i ] ].value, undefined, {
						onInputChange: value =>
						{
							this.updateStyleVar( keys[ i ], value )
						}
					} )
				] )

				this.helper.setCss( this.vars[ keys[ i ] ], this, CssClass.styleVar )

				mount(
					this.sidebar.bottom,
					this.vars[ keys[ i ] ],
					this.sidebar.bottom.children[ i ]?.nextElementSibling ?? undefined
				)
			}
		}
	}

	public onMenuBtnClick(): void
	{
		this.sidebar.main.classList.toggle( `open` )
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiRoot: {
				display: `grid`,
				gridTemplateColumns: `max-content 1fr`,
				width: `100%`,
				'@media (max-width: 766px)': {
					gridTemplateColumns: `none`,
					gridAutoRows: `max-content`
				}
			},
			uiComponentList: {
				paddingBottom: `100vh !important`,
				width: `100%`,
				height: `max-content`,
				overflow: `auto`
			},
			uiComponentBlock: {
				padding: `1rem`,
				borderBottom: `1px solid #0002`,
				height: `max-content`,
				width: `100%`,
				'& p': {
					margin: `0 0 1rem`
				}
			},
			uiComponentBlockInverted: {
				'& p': {
					margin: `0 0 1rem`
				},
				background: `#232323`
			},
			uiSidebar: {
				width: `300px`,
				maxHeight: `100vh`,
				overflow: `auto`,
				padding: `1rem`,
				background: `#357`,
				position: `sticky`,
				top: `0`,
				zIndex: `9998`,
				'&:after': {
					height: `100%`,
					content: `''`,
					display: `block`
				},
				'@media (max-width: 766px)': {
					position: `fixed`,
					height: `50%`,
					width: `95%`,
					left: `-100%`,
					top: `initial`,
					bottom: `2.5rem`,
					transition: `left ease-out 200ms`,
					borderRadius: `0.5rem`,
					background: `#3579`,
					boxShadow: `0 0 3px #3339`,
					'&.open': {
						left: `2.5%`
					}
				},
				'& > div:first-child': {
					borderBottom: `1px solid #fff3`,
					marginBottom: `1rem`,
					paddingBottom: `1rem`,
					'& a': {
						maxWidth: `max-content`,
						display: `block`,
						marginBottom: `0.5rem`
					}
				},
			},
			uiHeader: {
				position: `fixed`,
				bottom: `0`,
				width: `100%`,
				display: `none`,
				padding: `0.1rem`,
				zIndex: `9999`,
				'@media (max-width: 766px)': {
					display: `block`
				},
			},
			styleVar: {
				paddingTop: `1rem`,
				'& span': {
					color: `white`,
					display: `block`
				}
			},
			uiSpacer: {
				marginBottom: `1rem`
			},
			uiViewWrapper: {
				boxShadow: `0 0 5px 0px rgba(0,0,0,0.2)`,
				resize: `both`,
				overflow: `auto`,
				width: `640px`,
				height: `480px`,
				'@media (max-width: 766px)': {
					resize: `none`,
					overflow: `auto`,
					width: `auto`,
					height: `auto`,
				}
			},
			rectangle: {
				width: `100%`,
				height: `5px`
			}
		}
	}
}