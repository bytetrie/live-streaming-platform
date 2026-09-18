import type { Styles } from "jss"
import { el, RedomComponent, setChildren } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiSwitchGroup = `uiSwitchGroup`,
	uiSwitchGroupItem = `uiSwitchGroupItem`,
}

export interface UISwitchGroupHandler
{
	onClick: ( index: number ) => void
}

export class UISwitchGroup implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private itemEl: HTMLElement[]

	private inputEl: HTMLInputElement[]

	private selected: number[]

	constructor( 
		private helper: UIMetaHelper,
		private items: string[],
		private handler: UISwitchGroupHandler,
		selected: number[] = [],
		private multiselect?: boolean )
	{
		this.id = `UISwitchGroup`

		this.el = el( `div` )

		this.itemEl = []

		this.inputEl = []

		this.selected = [ ...selected ]

		this.selectItem = this.selectItem.bind( this )

		this.unselectItem = this.unselectItem.bind( this )

		this.update = this.update.bind( this )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiSwitchGroup )

		this.createSwitches()
	}

	private selectItem( index: number )
	{
		this.inputEl[ index ].checked = true
	}

	private unselectItem( index: number )
	{
		this.inputEl[ index ].checked = false
	}
	
	private createSwitches()
	{
		const r = Math.random()

		for ( let i = 0; i < this.items.length; i++ )
		{
			const id = `${i}__${r}`

			this.inputEl.push( el( 
				`input`, 
				{ id, type: this.multiselect ? `checkbox`: `radio`, name: `switch_${r}` },
				input => input.addEventListener( `click`, event => event.preventDefault() ) ) )

			const item = el(
				`div`,
				[
					this.inputEl[ i ],
					el( `label`, this.items[ i ], { for: id }, label => label.addEventListener( `click`, ( event ) => 
					{
						event.preventDefault()
						
						event.stopPropagation()

						this.handler.onClick( i )
					} ) )
				] )

			this.itemEl.push( item )

			this.helper.setCss( item, this, CssClass.uiSwitchGroupItem )

			if ( this.selected.includes( i ) ) this.selectItem( i )
		}

		setChildren( this.el, this.itemEl )
	}

	public update( selected: number[] ): this
	{
		for ( let i = 0; i < Math.max( this.selected.length, selected.length ); i++ )
		{
			if ( this.selected[ i ] !== undefined && !selected.includes( this.selected[ i ] ) )
			{
				this.unselectItem( this.selected[ i ] )
			}
			
			if ( selected[ i ] !== undefined && !this.selected.includes( selected[ i ] ) )
			{
				this.selectItem( selected[ i ] )
			}
		}

		this.selected = [ ...selected ]

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiSwitchGroup: {
				display: `grid`,
				gridTemplateColumns: `max-content max-content max-content`,
				position: `relative`
			},
			uiSwitchGroupItem: {
				'& label': {
					minWidth: `4rem`,
					textAlign: `center`,
					padding: `0.5rem 1rem`,
					background: data => data.switchGroupItemBG,
					display: `block`,
					marginLeft: `1px`,
					cursor: `pointer`,
					color: data => data.switchGroupItemText,
					transition: `background-color 300ms ease-out`,
					fontWeight: `600`,
					fontSize: `0.8rem`,
					borderBottom: `2px solid`,
					borderBottomColor: data => data.switchGroupItemBorder,
					'&:hover': {
						background: data => data.switchGroupItemHover,
					}
				},
				'&:first-child': {
					'& label': {
						marginLeft: `0`,
						borderTopLeftRadius: `1rem`,
						borderBottomLeftRadius: `1rem`
					},
				},
				'&:last-child': {
					'& label': {
						borderTopRightRadius: `1rem`,
						borderBottomRightRadius: `1rem`
					},
				},
				'& input': {
					visibility: `hidden`,
					position: `absolute`,
					left: `-9999px`,
					'&:checked': {
						'& + label': {
							background: data => data.switchGroupItemSelectedBG,
							color: data => data.switchGroupItemSelectedText,
							borderBottomColor: data => data.switchGroupItemSelectedBorder,
							'&:hover': {
								background: data => data.switchGroupItemSelectedHover
							}
						}
					}
				},
			},
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			switchGroupItemBG: `#cdcdcd`,
			switchGroupItemText: `#555`,
			switchGroupItemHover: `#b5b5b5`,
			switchGroupItemSelectedBG: `#316aac`,
			switchGroupItemSelectedText: `#f3f3f3`,
			switchGroupItemSelectedHover: `#2f4f9c`,
			switchGroupItemBorder: `#aaa`,
			switchGroupItemSelectedBorder: `#1f3f8c`
		}
	}
}	