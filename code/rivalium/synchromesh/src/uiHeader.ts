import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UILink } from "./uiLink"
import { UIButton } from "./uiButton"

enum CssClass
{
	uiHeader = `uiHeader`,
	uiHeaderBtn = `uiHeaderBtn`,
	uiHeaderHide = `uiHeaderHide`
}

export interface UIHeaderUpdateData
{
	menuBtnText?: string
	menuBtnURL?: string
}

export interface UIHeaderHandler
{
	gotoMenuURL: ( linkHREF: string ) => void
	showHelp: () => void
	hideHelp: () => void
}

export class UIHeader implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private menuBtn: HTMLAnchorElement

	private helpLink: UILink

	private helpToggle: UIButton

	constructor(
		private helper: UIMetaHelper,
		private menuBtnText: string,
		private menuBtnURL: string,
		handler?: UIHeaderHandler
	)
	{
		this.id = `UIHeader`

		this.menuBtn = el( `a`, this.menuBtnText, { href: this.menuBtnURL } )

		this.menuBtn.addEventListener( `click`, event =>
		{
			event.preventDefault()

			handler?.gotoMenuURL( this.menuBtnURL )
		} )

		this.helpLink = new UILink(
			this.helper,
			`#`,
			`Help`,
			{
				onLinkClick: () =>
				{
					handler?.showHelp()

					this.helper.setCss( this.helpLink.el, this, CssClass.uiHeaderHide )

					this.helper.unsetCss( this.helpToggle.el, this, CssClass.uiHeaderHide )
				}
			} )

		this.helpToggle = new UIButton(
			this.helper,
			`Close help`,
			{
				onClick: () =>
				{
					handler?.hideHelp()

					this.helper.setCss( this.helpToggle.el, this, CssClass.uiHeaderHide )

					this.helper.unsetCss( this.helpLink.el, this, CssClass.uiHeaderHide )
				}
			} )

		this.el = el( `header`, [ 
			el( `div`, this.menuBtn ), 
			el( `div`, [ this.helpLink, this.helpToggle ] ) 
		] )

		this.helper.getCSSClasses( this )
			
		this.helper.setCss( this.el, this, CssClass.uiHeader )

		this.helper.setCss( this.menuBtn, this, CssClass.uiHeaderBtn )

		this.helper.setCss( this.helpToggle.el, this, CssClass.uiHeaderHide )
	}

	private updateMenuURL( url: string )
	{
		this.menuBtnURL = url

		this.menuBtn.href = url
	}

	public update( { menuBtnText, menuBtnURL }: UIHeaderUpdateData ): this
	{
		if ( menuBtnText !== undefined ) this.menuBtn.textContent = menuBtnText

		if ( menuBtnURL !== undefined ) this.updateMenuURL( menuBtnURL )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiHeader: {
				minHeight: `2rem`,
				width: `100%`,
				border: `1px solid`,
				borderColor: data => data.headerBorder,
				display: `flex`,
				justifyContent: `space-between`,
				borderRadius: `0.2rem`,
				boxShadow: `0px 1px 2px #3333`,
				background: data => data.headerBG,
				'& > div': {
					display: `flex`,
					alignItems: `center`,
					'&:nth-child(2)': {
						'& a': {
							fontSize: `0.8rem`,
							margin: `0.2rem 0.5rem`,
						},
						'& button': {
							margin: `0 0.2rem`,
						}
					}
				}
			},
			uiHeaderBtn: {
				height: `100%`,
				background: `transparent`,
				border: `none`,
				borderRight: `1px solid`,
				borderRightColor: data => data.headerBorder,
				borderBottom: `2px solid`,
				borderBottomColor: data => data.headerButtonHoverBG,
				cursor: `pointer`,
				padding: `0.2rem 0.7rem`,
				fontSize: `0.8rem`,
				transition: `background-color 200ms ease-out`,
				textDecoration: `none`,
				display: `grid`,
				placeItems: `center`,
				color: data => data.headerButton,
				'&:focus': {
					outline: `none`,
				},
				'&:hover': {
					background: data => data.headerButtonHoverBG
				},
				'&:active': {
					background: data => data.headerButtonActiveBG
				}
			},
			uiHeaderHide: {
				display: `none`
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			headerBG: `#fafafa`,
			headerBorder: `#bbb`,
			headerButtonHoverBG: `rgba(0, 0, 0, 0.1)`,
			headerButtonActiveBG: `rgba(0, 0, 0, 0.2)`,
			headerButton: `#333`
		}
	}
}