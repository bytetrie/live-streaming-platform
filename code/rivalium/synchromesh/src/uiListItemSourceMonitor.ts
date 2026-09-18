import type { Styles } from "jss"
import { el, mount, RedomElement, setChildren } from "redom"
import type { UIAnimatedRectangle } from "./uiAnimatedRectangle"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UILink } from "./uiLink"

enum CssClass
{
	uiListItemSourceMonitor = `uiListItemSourceMonitor`,
	uiListItemSourceMonitorMonitor = `uiListItemSourceMonitorMonitor`,
	uiListItemSourceMonitorLink = `uiListItemSourceMonitorLink`,
	uiListItemSourceMonitorTop = `uiListItemSourceMonitorTop`
}

export interface UIListItemSourceMonitorData
{
	linkText?: string
	linkHREF?: string
	annotation?: HTMLElement | RedomElement
	monitor?: UIAnimatedRectangle
	gotoItem?: (  linkHREF: string ) => void
}

export class UIListItemSourceMonitor implements UI.Styled<CssClass>
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private link?: UILink

	private sourceVolumeMonitor?: UIAnimatedRectangle

	private annotation?: HTMLElement | RedomElement

	private itemTop?: HTMLElement

	private helper?: UIMetaHelper

	constructor()
	{
		this.id = `UIListItemSourceMonitor`

		this.el = el( `li` )

		this.styles = this.styles.bind( this )
	}

	public update( 
		{ linkHREF, linkText, monitor, annotation, gotoItem }: UIListItemSourceMonitorData, 
		_: number, 
		__: UIListItemSourceMonitorData[], 
		{ helper }: {helper: UIMetaHelper} ): this
	{
		let setCss = false

		if ( !this.helper ) 
		{
			this.helper = helper

			setCss = true
		}

		if( !this.link )
		{
			this.link = new UILink(
				this.helper,
				linkHREF ?? `#`,
				linkText ?? ``,
				gotoItem ? { onLinkClick: gotoItem } : undefined  )
		}

		if ( !this.itemTop )
		{
			this.itemTop = el( `div`, this.link )

			mount( this.el, this.itemTop )
		}

		if ( annotation )
		{
			this.annotation = annotation

			setChildren( this.itemTop, [ this.link, this.annotation ] )
		}

		if ( linkHREF ) this.link.update( { url: linkHREF } )

		if ( linkText ) this.link.update( { text: linkText } )

		if ( monitor )
		{
			this.sourceVolumeMonitor = monitor
			
			mount( this.el, this.sourceVolumeMonitor )
		}

		if ( setCss ) 
		{
			this.helper.getCSSClasses( this )

			this.helper.setCss( this.el, this, CssClass.uiListItemSourceMonitor )

			this.helper.setCss( this.link.el, this, CssClass.uiListItemSourceMonitorLink )

			if ( this.sourceVolumeMonitor )
				this.helper.setCss( this.sourceVolumeMonitor.el, this, CssClass.uiListItemSourceMonitorMonitor )

			this.helper.setCss( this.itemTop, this, CssClass.uiListItemSourceMonitorTop )
		}

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiListItemSourceMonitor: {
				listStyle: `none`,
				display: `block`,
				transition: `background ease-out 200ms`,
				'@media (min-width: 767px)': {
					'&:hover': {
						background: data => data.monitorListItemHoverBG
					}
				}
			},
			uiListItemSourceMonitorLink: {
				gridArea: `link`,
				width: `maxContent`,
				whiteSpace: `nowrap`,
				overflow: `hidden`,
				textOverflow: `ellipsis`,
				fontWeight: `600`
			},
			uiListItemSourceMonitorMonitor: {
				gridArea: `monitor`,
				height: `0.8rem`,
				marginTop: `0.5rem`,
				maxWidth: `10rem`
			},
			uiListItemSourceMonitorTop: {
				display: `flex`,
				justifyContent: `space-between`,
				alignItems: `center`,
				'& > *': {
					'&:first-child': {
						flex: `0 1 auto`,
						marginRight: `1rem`,
						whiteSpace: `nowrap`,
						overflow: `hidden`,
						textOverflow: `ellipsis`,
						fontWeight: `600`
					},
					'&:last-child': {
						maxWidth: `max-content`,
						whiteSpace: `nowrap`
					},
				}
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			monitorListItemHoverBG: `#5551`
		}
	}
}	