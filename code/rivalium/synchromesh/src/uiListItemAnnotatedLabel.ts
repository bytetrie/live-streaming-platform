import type { Styles } from "jss"
import { el, mount, RedomElement, setChildren } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UILink } from "./uiLink"
import { UIText } from "./uiText"

enum CssClass
{
	uiListItemAnnotatedLabel = `uiListItemAnnotatedLabel`,
	uiListItemAnnotatedLabelSubtext = `uiListItemAnnotatedLabelSubtext`,
	uiListItemAnnotatedLabelTop = `uiListItemAnnotatedLabelTop`
}

export interface UIListItemAnnotatedLabelUpdateData
{
	linkText?: string
	linkHREF?: string
	subtext?: string
	annotation?: HTMLElement | RedomElement
	gotoItem?: ( linkHREF: string ) => void
}

export class UIListItemAnnotatedLabel implements UI.Styled<CssClass>
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private link?: UILink

	private subtext?: UIText

	private annotation?: HTMLElement | RedomElement

	private itemTop?: HTMLElement

	private helper?: UIMetaHelper

	constructor()
	{
		this.id = `UIListItemAnnotatedLabel`

		this.el = el( `li` )

		this.styles = this.styles.bind( this )
	}

	public update( 
		{ annotation, linkHREF, linkText, subtext, gotoItem }: UIListItemAnnotatedLabelUpdateData, 
		_: number, 
		__: UIListItemAnnotatedLabelUpdateData[], 
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
				gotoItem ? { onLinkClick: gotoItem } : undefined )
		}

		if ( !this.itemTop )
		{
			this.itemTop = el( `div`, this.link )

			mount( this.el, this.itemTop )
		}

		if ( !this.subtext )
		{
			this.subtext = new UIText( this.helper, subtext ?? `` )
			
			mount( this.el, this.subtext )
		}

		if ( annotation )
		{
			this.annotation = annotation

			setChildren( this.itemTop, [ this.link, this.annotation ] )
		}

		if ( linkHREF !== undefined ) this.link.update( { url: linkHREF } )

		if ( linkText !== undefined ) this.link.update( { text: linkText } )

		if ( subtext !== undefined ) this.subtext.update( subtext )

		if ( setCss ) 
		{
			this.helper.getCSSClasses( this )

			this.helper.setCss( this.el, this, CssClass.uiListItemAnnotatedLabel )

			this.helper.setCss( this.itemTop, this, CssClass.uiListItemAnnotatedLabelTop )

			this.helper.setCss( this.subtext.el, this, CssClass.uiListItemAnnotatedLabelSubtext )
		}

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiListItemAnnotatedLabel: {
				listStyle: `none`,
				display: `block`,
				transition: `background ease-out 200ms`,
				'@media (min-width: 767px)': {
					'&:hover': {
						background: data => data.annotatedListItemHoverBG
					}
				}
			},
			uiListItemAnnotatedLabelSubtext: {
				width: `100%`,
				whiteSpace: `nowrap`,
				textOverflow: `ellipsis`,
				display: `block`,
				overflow: `hidden`,
				fontSize: `0.9em`,
				fontWeight: `600`,
				paddingTop: `0.15rem`
			},
			uiListItemAnnotatedLabelTop: {
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
						fontSize: `0.85rem`
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
			annotatedListItemHoverBG: `#5551`
		}
	}
}	