import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import { UITextCopy } from "./uiTextCopy"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UISwitchGroup } from "./uiSwitchGroup"
import { UIText } from "./uiText"

enum CssClass
{
	uiStreamURLs = `uiStreamURLs`,
	uiStreamURLsAdmin = `uiStreamURLsAdmin`,
	uiStreamURLsAdminShow = `uiStreamURLsAdminShow`
}

enum ShowAdminState
{
	hide = `Hide URL`,
	show = `Show URL`
}

export class UIStreamURLs implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private currentShowAdminState: ShowAdminState

	private showAdminStates: ShowAdminState[]

	private cloudAdminToggle: UISwitchGroup

	private cloudAdminCopy: UITextCopy

	private cloudPublicCopy: UITextCopy

	constructor( private helper: UIMetaHelper, adminURL = ``, publicURL = `` )
	{
		this.id = `UIStreamURLs`

		this.onShowAdminSwitchClick = this.onShowAdminSwitchClick.bind( this )

		this.currentShowAdminState = ShowAdminState.hide

		this.showAdminStates = Object.values( ShowAdminState )

		this.cloudAdminToggle = new UISwitchGroup(
			this.helper,
			this.showAdminStates,
			{
				onClick: this.onShowAdminSwitchClick
			},
			[ 0 ],
			false
		)

		this.cloudAdminCopy = new UITextCopy( this.helper, adminURL )

		this.cloudPublicCopy = new UITextCopy( this.helper, publicURL )

		const wrap = el( `div`, [
			new UIText( this.helper, `Stream admin URL (keep private)` ),
			this.cloudAdminToggle, 
			this.cloudAdminCopy 
		] )

		this.el = el( `div`, [
			new UIText( this.helper, `Stream public URL (share with others)` ),
			this.cloudPublicCopy,
			wrap
		] )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiStreamURLs )

		this.helper.setCss( wrap, this, CssClass.uiStreamURLsAdmin )
	}
	
	private onShowAdminSwitchClick( index: number )
	{
		if ( this.showAdminStates[ index ] === this.currentShowAdminState ) return

		this.currentShowAdminState = this.showAdminStates[ index ] 

		this.cloudAdminToggle?.update( [ index ] )

		if ( this.showAdminStates[ index ] === ShowAdminState.show )
		{
			this.helper.setCss( this.cloudAdminCopy.el, this, CssClass.uiStreamURLsAdminShow )
		}
		else
		{
			this.helper.unsetCss( this.cloudAdminCopy.el, this, CssClass.uiStreamURLsAdminShow )
		}
	}

	public update( { publicURL, adminURL }: {publicURL: string, adminURL: string} ): this
	{
		this.cloudAdminCopy.update( adminURL )

		this.cloudPublicCopy.update( publicURL )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiStreamURLs: {
				maxWidth: `25rem`,
				'& span': {
					display: `block`,
					marginBottom: `0.2rem`
				}
			},
			uiStreamURLsAdmin: {
				margin: `1rem 0 0.5rem`,
				'& > div:nth-child(2)': {
					marginBottom: `0.5rem`
				},
				'& > div:last-child:not($uiStreamURLsAdminShow)': {
					display: `none`
				}
			},
			uiStreamURLsAdminShow: {}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}