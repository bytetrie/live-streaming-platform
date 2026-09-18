#ifndef APP_MAIN_H
#define APP_MAIN_H

#include "../context/context.hpp"
#include "../dataManager/dataManager.hpp"
#include "../renderer/renderer.hpp"

struct App : public RendererDelegate, public ContextDelegate
{
  private:
    Context c;
    Renderer r;
    DataManager d;
    // void rendererEvent( VertexArrays& setVertexArray ) override;
    // void rendererEvent( void* onDrawCompleted = NULL ) override;
    virtual void rendererEvent_setVertexArray( VertexArrays& vArray ) override;
    virtual void rendererEvent_onDrawCompleted( ) override;
    void update( float& time ) override;

  public:
    App( );
    virtual ~App( ) = default;
    bool run( );
};

#endif