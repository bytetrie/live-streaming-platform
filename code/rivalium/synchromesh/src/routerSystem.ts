/**
 * ## Routes
 *
 * / -> Redirects to new recording, /recording/<id>
 * /recording -> recording list
 * /recording/<id> -> recording item
 * /recording/<id>/source -> manage sources
 * /recording/<id>/source/<id> -> manage source channel
 * /stream -> listen list
 * /stream/<id> -> listen item
 * /stream/<id>/add -> group add (group type only, redirect otherwise)
 * /stream/<id>/edit -> group edit (group type only, redirect otherwise)
 */

import createRouter, { Router, State, SubscribeState } from "router5"
import browserPlugin from "router5-plugin-browser"

export enum Route
{
	recordingList = `recordingList`,
	recordingItem = `recordingList.recordingItem`,
	sourceList = `recordingList.recordingItem.sourceList`,
	sourceItem = `recordingList.recordingItem.sourceList.sourceItem`,
	sourceItemID = `sourceItemID`,
	listenList = `listenList`,
	listenItem = `listenList.listenItem`,
	listenAdd = `listenList.listenItem.listenAdd`,
	listenEdit = `listenList.listenItem.listenEdit`,
	group = `listenList.listenItem.group`
}

interface ListUpdate
{
	route: Route.recordingList | Route.listenList
}

interface SourceItemUpdate
{
	route: Route.sourceItem
	data: {recordingItemID: string, sourceItemID: string}
}

interface ItemUpdate
{
	route: 
		| Route.recordingItem
		| Route.sourceList
		| Route.listenItem
		| Route.listenAdd
		| Route.listenEdit
		| Route.sourceItemID
		| Route.group
	data: {id: string}
}

export interface RouterSystemHandler
{
	onRouterUpdate: ( route: Route ) => void
}

export type RouterSystemUpdateData = ListUpdate | ItemUpdate | SourceItemUpdate

export class RouterSystem
{
	private router: Router

	private routeMap: Record<Route, string>

	// get correct id name for route id
	private idMap: Record<string, string>

	constructor( private handler: RouterSystemHandler, private baseURL: URL )
	{
		this.onRouteChange = this.onRouteChange.bind( this )

		this.routeMap = {
			[ Route.recordingList ]: `/recording`,
			[ Route.recordingItem ]: `/:recordingItemID`,
			[ Route.sourceList ]: `/source`,
			[ Route.sourceItem ]: `/:sourceItemID`,
			[ Route.listenList ]: `/stream`,
			[ Route.listenItem ]: `/:listenItemID`,
			[ Route.listenAdd ]: `/add`,
			[ Route.listenEdit ]: `/edit`,
			[ Route.sourceItemID ]: `/source/:sourceItemID`,
			[ Route.group ]: `/group`
		}

		this.router = createRouter( [
			{
				name: Route.recordingList,
				path: this.routeMap[ Route.recordingList ]
			},
			{
				name: Route.recordingItem, 
				path: this.routeMap[ Route.recordingItem ]
			},
			{
				name: Route.sourceList, 
				path: this.routeMap[ Route.sourceList ],
			},
			{
				name: Route.sourceItem, 
				path: this.routeMap[ Route.sourceItem ]
			},
			{
				name: Route.listenList,
				path: this.routeMap[ Route.listenList ]
			},
			{
				name: Route.listenItem, 
				path: this.routeMap[ Route.listenItem ],
			},
			{
				name: Route.listenAdd, 
				path: this.routeMap[ Route.listenAdd ]
			},
			{
				name: Route.listenEdit,
				path: this.routeMap[ Route.listenEdit ]
			},
			{
				name: Route.sourceItemID,
				path: this.routeMap[ Route.sourceItemID ]
			},
			{
				name: Route.group,
				path: this.routeMap[ Route.group ]
			},
		] )

		this.idMap = {
			[ Route.recordingItem ]: `recordingItemID`,
			[ Route.sourceList ]: `recordingItemID`,
			[ Route.listenItem ]: `listenItemID`,
			[ Route.listenAdd ]: `listenItemID`,
			[ Route.listenEdit ]: `listenItemID`,
			[ Route.sourceItemID ]: `sourceItemID`,
			[ Route.group ]: `listenItemID`,
		}

		// The router lib doesn't strip trailing slash, so it's erroneously preserved
		// if it's provided in the `base` property.
		this.router.usePlugin( browserPlugin( { base: this.baseURL.toString().replace( /\/$/, `` ) } ) )

		this.router.subscribe( this.onRouteChange )
	}

	private onRouteChange( state: SubscribeState )
	{
		this.handler.onRouterUpdate( state.route.name as Route )
	}

	private data( request: RouterSystemUpdateData )
	{
		return `data` in request
			? `id` in request.data
				? { [ this.idMap[ request.route ] ]: request.data.id }
				: { ...request.data }
			: {}
	}

	private stateToData( state: State ): RouterSystemUpdateData
	{
		switch( state.name )
		{
			case Route.recordingItem:

			case Route.sourceList:

			case Route.listenItem:

			case Route.listenAdd:

			case Route.listenEdit:

			case Route.sourceItemID:

			case Route.group:

				if ( !( this.idMap[ state.name ] in state.params ) )
				{
					throw Error( `Parameter ${this.idMap[ state.name ]} not in route.` )
				}

				return {
					route: state.name,
					data: { id: state.params[ this.idMap[ state.name ] ] }
				}

			case Route.sourceItem:

				if ( !( `recordingItemID` in state.params && `sourceItemID` in state.params ) )
				{
					throw Error( `Parameters not in route.` )
				}

				return {
					route: state.name,
					data: {
						recordingItemID: state.params.recordingItemID, 
						sourceItemID: state.params.sourceItemID
					}
				}

			case Route.recordingList:

			case Route.listenList:

				return { route: state.name }

			default:

				throw Error( `Unknown route ${state.name}.` )
		}
	}

	public dataFromURL( url: string ): RouterSystemUpdateData
	{
		const state = this.router.matchUrl( url )

		if ( !state ) throw Error( `Unknown URL ${url}` )

		return this.stateToData( state )
	}

	public getURLForRoute( request: RouterSystemUpdateData ): URL
	{
		return new URL( this.router.buildUrl( request.route, this.data( request ) ) )
	}

	public update( update: RouterSystemUpdateData ): void
	{
		this.router.navigate( update.route, this.data( update ), { force: true } )
	}

	public init(): void
	{
		this.router.start()
	}

	public current(): Route
	{
		return this.dataFromURL( this.router.getState().path ).route
	}
}
