import { Route, RouterSystem, RouterSystemUpdateData } from "./routerSystem"
import { View } from "./uiMetaViewManager"

interface RouteMap
{
	view: View
	navigation: () => RouterSystemUpdateData
	data: () => RouterSystemUpdateData
	goto: ( linkHREF: string ) => void
}

interface RouterAdaptorProvider
{
	current: {
		listen?: ListenItem,
		recording?: RecordingItem,
		source?: SourceItem
	}
}

export interface RouterAdaptorHandler
{
	onRouterAdaptorError: ( error: Error ) => void
	updateCurrentRecordingItem: ( id: string, url: string ) => Promise<void>
	updateCurrentListenItem: ( id: string, url: string ) => void
	updateCurrentSourceItem: ( id: string ) => void
	routerReady: () => void
	onHandleAddGroup: ( groupURL: URL, groupID: string ) => void
}

/**
 * Manages the requests for routing
 */
export class RouterAdaptor
{
	public routeMap: Record<Route, RouteMap>

	public routeSet: {
		recording: Route[]
		listen: Route[]
	}

	constructor(
		private router: RouterSystem,
		private handler: RouterAdaptorHandler,
		private provider: RouterAdaptorProvider )
	{

		this.gotoRecordingList = this.gotoRecordingList.bind( this )
		
		this.gotoGroup = this.gotoGroup.bind( this )
		
		this.gotoListenList = this.gotoListenList.bind( this )
		
		this.gotoRecordingItem = this.gotoRecordingItem.bind( this )
		
		this.gotoAddStreamsToGroup = this.gotoAddStreamsToGroup.bind( this )
		
		this.gotoEditStreamsForGroup = this.gotoEditStreamsForGroup.bind( this )
		
		this.gotoListenItem = this.gotoListenItem.bind( this )
		
		this.gotoSourceList = this.gotoSourceList.bind( this )

		this.gotoSourceItem = this.gotoSourceItem.bind( this )

		this.routeSet = {
			recording: [ Route.recordingItem, Route.sourceItem, Route.sourceList ],
			listen: [ Route.listenAdd, Route.listenEdit, Route.listenItem ]
		}

		this.routeMap = this.getRouteViewMap()
	}

	private recordBase<T extends Route>( route: T )
	{
		const base: { route: Route.recordingList } = { route: Route.recordingList }

		const { recording } = this.provider.current

		if ( !recording ) return base

		if ( recording.redirect )
		{
			const _data = this.router.dataFromURL( recording.redirect.toString() )

			if ( !( `data` in _data && `id` in _data.data ) ) return base

			return ( { route, data: { id: _data.data.id } } )
		}

		const _data = this.router.dataFromURL( recording.endpoint.toString() )

		if ( !( `data` in _data && `id` in _data.data ) ) return base

		return ( { route, data: { id: _data.data.id } } )
	}

	private listenBase<T extends Route>( route: T )
	{
		const base: { route: Route.listenList } = { route: Route.listenList }

		const { listen } = this.provider.current

		if ( !listen ) return base

		if ( listen.redirect )
		{
			const _data = this.router.dataFromURL( listen.redirect.toString() )

			if ( !( `data` in _data && `id` in _data.data ) ) return base

			return ( { route, data: { id: _data.data.id } } )
		}

		const _data = this.router.dataFromURL( listen.endpoint.toString() )

		if ( !( `data` in _data && `id` in _data.data ) ) return base

		return ( { route, data: { id: _data.data.id } } )
	}

	private getRouteViewMap(): Record<Route, RouteMap>
	{
		return {
			[ Route.listenAdd ]: {
				view: View.listenAdd,
				navigation: () => this.listenBase( Route.listenItem ),
				data: () => this.listenBase( Route.listenAdd ),
				goto: this.gotoAddStreamsToGroup
			},
			[ Route.listenEdit ]: {
				view: View.listenEdit,
				navigation: () => this.listenBase( Route.listenItem ),
				data: () => this.listenBase( Route.listenEdit ),
				goto: this.gotoEditStreamsForGroup
			},
			[ Route.listenItem ]: {
				view: View.listenItem,
				navigation: () => ( { route: Route.listenList } ),
				data: () => this.listenBase( Route.listenItem ),
				goto: this.gotoListenItem
			},
			[ Route.listenList ]: {
				view: View.listenList,
				navigation: () => ( { route: Route.recordingList } ),
				data: () => ( { route: Route.listenList } ),
				goto: this.gotoListenList
			},
			[ Route.recordingItem ]: {
				view: View.recordingItem,
				navigation: () => ( { route: Route.recordingList } ),
				data: () => this.recordBase( Route.recordingItem ),
				goto: this.gotoRecordingItem
			},
			[ Route.recordingList ]: {
				view: View.recordingList,
				navigation: () => ( { route: Route.listenList } ),
				data: () => ( { route: Route.recordingList } ),
				goto: this.gotoRecordingList
			},
			[ Route.sourceItem ]: {
				view: View.sourceItem,
				navigation: () => this.recordBase( Route.sourceList ),
				data: () =>
				{
					const { source } = this.provider.current

					const base: {route: Route.recordingList} = { route: Route.recordingList }

					if ( !source ) return base

					const data = this.router.dataFromURL( source.endpoint?.toString() )

					if ( !( `data` in data ) 
						|| !( `recordingItemID` in data.data && `sourceItemID` in data.data ) ) 
						return base

					return source
						? ( { route: Route.sourceItem, data: data.data } )
						: ( { route: Route.recordingList } )
				},
				goto: this.gotoSourceItem
			},
			[ Route.sourceList ]: {
				view: View.sourceList,
				navigation: () => this.recordBase( Route.recordingItem ),
				data: () => this.recordBase( Route.sourceList ),
				goto: this.gotoSourceList
			},
			[ Route.sourceItemID ]: {
				view: View.sourceItem,
				navigation: () => this.recordBase( Route.sourceList ),
				data: () => this.recordBase( Route.sourceItemID ),
				goto: this.gotoSourceItem
			},
			[ Route.group ]: {
				view: View.listenItem,
				navigation: () => this.recordBase( Route.listenList ),
				data: () => this.recordBase( Route.group ),
				goto: this.gotoGroup
			}
		}
	}

	public gotoRecordingList(): void
	{
		this.router.update( this.routeMap[ Route.recordingList ].data() )
	}
	
	public gotoGroup( linkHREF: string ): void
	{
		const data = this.router.dataFromURL( linkHREF )

		try
		{
			if ( !( `data` in data && `id` in data.data ) )
			{
				throw Error( `No group ID in route` )
			}

			/**
			 * Sometimes route will be "stream" if coming
			 * from an internal view, such as add/edit streams
			 * 
			 * Or will be "group" if coming from externally,
			 * where a group has been shared. In this case, we
			 * need to call a function to check and attempt to
			 * load the group into state, which should redirect
			 * us to the correct stream route.
			 */
			if ( data.route === Route.group )
			{
				const url = new URL( linkHREF )

				const groupURL = new URL( `/group/${data.data.id}`, url.origin )

				this.handler.onHandleAddGroup( groupURL, data.data.id )

				return
			}

			this.router.update( data )
		}
		catch ( error )
		{
			this.handler.onRouterAdaptorError( error )

			this.gotoListenList()
		}
	}
	
	public gotoListenList(): void
	{
		this.router.update( this.routeMap[ Route.listenList ].data() )
	}
	
	public gotoAddStreamsToGroup( linkHREF: string ): void
	{
		try
		{
			const data = this.router.dataFromURL( linkHREF )

			if ( !( `data` in data && `id` in data.data ) )
			{
				throw Error( `No stream ID in route` )
			}
	
			const item = this.router.getURLForRoute( { route: Route.listenItem, data: { id: data.data.id } } )

			const { listen: listenOld } = this.provider.current

			const itemURL = item.toString()
	
			if ( itemURL === listenOld?.endpoint.toString() )
			{
				this.router.update( this.routeMap[ Route.listenAdd ].data() )
	
				return
			}

			this.handler.updateCurrentListenItem( data.data.id, itemURL )

			const { listen } = this.provider.current

			if ( listen?.redirect )
			{
				this.gotoAddStreamsToGroup( listen.redirect.toString() )
			}
			else
			{
				this.router.update( this.routeMap[ Route.listenAdd ].data() )
			}
		}
		catch ( error )
		{
			this.handler.onRouterAdaptorError( error )

			this.gotoListenList()
		}
	}
	
	public gotoEditStreamsForGroup( linkHREF: string ): void
	{
		try
		{
			const data = this.router.dataFromURL( linkHREF )

			if ( !( `data` in data && `id` in data.data ) )
			{
				throw Error( `No stream ID in route` )
			}
	
			const item = this.router.getURLForRoute( { route: Route.listenItem, data: { id: data.data.id } } )

			const { listen: listenOld } = this.provider.current

			const itemURL = item.toString()
	
			if ( itemURL === listenOld?.endpoint.toString() )
			{
				this.router.update( this.routeMap[ Route.listenEdit ].data() )
	
				return
			}

			this.handler.updateCurrentListenItem( data.data.id, itemURL )

			const { listen } = this.provider.current

			if ( listen?.redirect )
			{
				this.gotoEditStreamsForGroup( listen.redirect.toString() )
			}
			else
			{
				this.router.update( this.routeMap[ Route.listenEdit ].data() )
			}
		}
		catch ( error )
		{
			this.handler.onRouterAdaptorError( error )

			this.gotoListenList()
		}
	}

	public gotoSourceList(): void
	{
		this.router.update( this.routeMap[ Route.sourceList ].data() )
	}
	
	public gotoRecordingItem( linkHREF: string ): void
	{
		const data = this.router.dataFromURL( linkHREF )

		try
		{
			if ( !( `data` in data && `id` in data.data ) )
			{
				throw Error( `No recording ID in route` )
			}

			this.handler.updateCurrentRecordingItem( data.data.id, linkHREF )
				.then( () =>
				{
					const { recording } = this.provider.current

					if ( recording?.redirect )
					{
						this.gotoRecordingItem( recording.redirect.toString() )
					}
					else
					{
						this.router.update( data )
					}
				} )
		}
		catch ( error )
		{
			this.handler.onRouterAdaptorError( error )

			this.gotoRecordingList()
		}
	}
	
	public gotoListenItem( linkHREF: string ): void
	{
		const data = this.router.dataFromURL( linkHREF )

		try
		{
			if ( !( `data` in data && `id` in data.data ) )
			{
				throw Error( `No stream ID in route` )
			}

			this.handler.updateCurrentListenItem( data.data.id, linkHREF )

			const { listen } = this.provider.current

			if ( listen?.redirect )
			{
				this.gotoListenItem( listen.redirect.toString() )
			}
			else
			{
				this.router.update( data )
			}
		}
		catch ( error )
		{
			this.handler.onRouterAdaptorError( error )

			this.gotoListenList()
		}
	}

	public gotoSourceItem( linkHREF: string ): void
	{
		const sourceData = this.router.dataFromURL( linkHREF )

		try
		{
			if ( !( `data` in sourceData && `id` in sourceData.data ) )
			{
				throw Error( `No source ID in route` )
			}

			this.handler.updateCurrentSourceItem( linkHREF )

			/**
			 * The URLs used by the source items are not
			 * in the context of recording items such
			 * that they are universal to all items. Therefore
			 * to maintain the route hierarchy, we actually
			 * load the current route data to build a different
			 * route to the one in the actual source list
			 */
			const { recording } = this.provider.current

			if ( recording )
			{
				const recordingData = this.router.dataFromURL( recording.endpoint.toString() )

				if ( !( `data` in recordingData && `id` in recordingData.data ) )
				{
					this.router.update( sourceData )

					return
				}

				if ( recording.redirect )
				{
					const redirectData = this.router.dataFromURL( recording.redirect.toString() )

					if ( !( `data` in redirectData && `id` in redirectData.data ) )
					{
						this.router.update( sourceData )

						return
					}

					this.router.update( { route: Route.sourceItem, data: {
						recordingItemID: redirectData.data.id,
						sourceItemID: sourceData.data.id
					} } )
				}
				else
				{
					this.router.update( { route: Route.sourceItem, data: {
						recordingItemID: recordingData.data.id,
						sourceItemID: sourceData.data.id
					} } )
				}
			}
			else
			{
				this.router.update( sourceData )
			}
		}
		catch ( error )
		{
			this.handler.onRouterAdaptorError( error )

			this.gotoSourceList()
		}
	}

	public initRoutes(): void
	{
		this.router.init()

		this.handler.routerReady()

		try
		{
			const { route } = this.router.dataFromURL( window.location.pathname )

			this.routeMap[ route ].goto( window.location.href )
		}
		catch
		{
			// no path, redirect to recording list
			this.gotoRecordingList()
		}
	}
}