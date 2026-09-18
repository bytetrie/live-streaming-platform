#ifndef SHADERS_H
#define SHADERS_H

#include <GL/glew.h>
#include <fstream>
#include <iostream>
#include <string>

GLuint loadShaderFromFile( const char* filename, GLenum shaderType );

GLuint createShaderProgram( GLuint& vertexShader, GLuint& fragmentShader );

#endif