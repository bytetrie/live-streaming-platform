#ifndef CONTEXT_H
#define CONTEXT_H

#include "contextException.hpp"
#include <GL/glew.h>
#include <SDL2/SDL.h>
#include <SDL2/SDL_opengl.h>
#include <iostream>

class ContextDelegate
{
  public:
    virtual ~ContextDelegate( )        = default;
    virtual void update( float& time ) = 0;
};

class Context
{
  private:
    SDL_Window* window;
    SDL_GLContext context;
    void checkGLErrors( );

  public:
    ContextDelegate* delegate;
    float time;

    Context( );
    ~Context( );
    void close( );
    bool loop( );
};

#endif