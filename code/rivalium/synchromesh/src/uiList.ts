import type { Styles } from "jss"
import { el, list, List, RedomComponent, RedomComponentClass } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiList = `uiList`
}

export interface UIListUpdateData<T>
{
	ordering?: string[]
	item?: {id: string, data: T}
	update?: {id: string, data: Partial<T>}
	clear?: boolean
	remove?: string
}

export class UIList<T> implements UI.Styled<CssClass>, RedomComponent
{
	private list: List

	public id: string

	public el: HTMLUListElement

	public classes?: Record<CssClass, string>

	constructor( 
		private helper: UIMetaHelper,
		itemConstructor: RedomComponentClass,
		private items: Record<string, T> = {},
		private ordering: string[] = [] )
	{
		this.id = `UIList`

		this.el = el( `ul` )

		this.list = list( this.el, itemConstructor )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiList )

		this.mountItems()
	}

	private mountItems()
	{
		const list = []

		for ( let i = 0; i < this.ordering.length; i++ )
		{
			list[ i ] = this.items[ this.ordering[ i ] ]
		}

		this.list.update( list, { helper: this.helper } )
	}

	private setOrdering( ordering: string[] )
	{
		this.ordering = [ ...ordering ]

		this.mountItems()
	}

	private setItem( itemID: string, data: T, ordering?: string[] )
	{
		const exists = this.items[ itemID ] !== undefined

		this.items[ itemID ] = data

		if ( ordering )
		{
			this.setOrdering( ordering )
		}
		else
		{
			if ( !exists )
			{
				this.ordering.splice( 0, 0, itemID )
				
			}

			this.mountItems()
		}
	}

	private removeItem( itemID: string )
	{
		if( !this.items[ itemID ] ) return

		delete this.items[ itemID ]
	}

	private clearList()
	{
		this.ordering = []

		this.items = {}

		this.list.update( [], { helper: this.helper } )
	}

	public update( { ordering, item, update, clear, remove }: UIListUpdateData<T> ): this
	{
		if ( clear )
			this.clearList()
		else if ( remove )
			this.removeItem( remove )
		else if ( item )
			this.setItem( item.id, item.data, ordering )
		else if ( update && this.items[ update.id ] )
			this.setItem( update.id, { ...this.items[ update.id ], ...update.data } )
		else if ( ordering )
			this.setOrdering( ordering )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiList: {
				display: `block`,
				width: `100%`,
				padding: `0`,
				margin: `0`,
				'& > li': {
					marginBottom: `1rem`,
					paddingBottom: `0.5rem`,
					borderBottom: `1px solid`,
					borderBottomColor: data => data.listItemDivider
				}
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			listItemDivider: `#bbb`
		}
	}
}	