#ifndef RENDERER_H
#define RENDERER_H

#include <GL/glew.h>
#include <SDL2/SDL.h>
#include <SDL2/SDL_opengl.h>
#include <cstdlib>
#include <ctime>
#include <glm/glm.hpp>

struct VertexArrays
{
    float** vertices;
    int* arraySize;
    int total = 0;
    float color[ 60 ];

    VertexArrays( )
    {
        srand( static_cast<unsigned>( time( 0 ) ) );
        for ( int i = 0; i < 60; ++i )
        {
            color[ i ] =
                static_cast<float>( rand( ) ) / static_cast<float>( RAND_MAX );
        }
    }
};

class RendererDelegate
{
  public:
    virtual ~RendererDelegate( )                                      = default;
    virtual void rendererEvent_setVertexArray( VertexArrays& vArray ) = 0;
    virtual void rendererEvent_onDrawCompleted( )                     = 0;
};

class Renderer
{
  private:
    GLuint sceneVertexShader;
    GLuint sceneFragmentShader;
    GLuint sceneShaderProgram;

    GLuint vaoPoints;
    GLuint vboPoints;

    VertexArrays vArrays;

  public:
    RendererDelegate* delegate;

    Renderer( );
    ~Renderer( );
    void draw( float& time );
};

#endif