# CP437

"Code Page 437" is the extended ASCII table, where each glyph can be identified using 8 bits
See cp437.txt for the exact sequence of 256 characters.
In essense, the entire glyph texture should become this code page (for now).

# glyphs.ts

Actual text rendering, etc., should be removed from terminal.ts and into glyphs.ts.
When rendering text: `const glyphs = glyphs_from("&f0;&b0;my&f;&b; string\n\t", rows, cols);`
Which will generate an already compiled "slice" of the vertex buffering (e.g., each glyph has its attributes pre-computed).
All components should then listen for "resize" events from the terminal's canvas, and when this happens, recompute their glyphs (if necessary).
For ease of use in Terminal, GlyphRect should be a class/type which contains row, col, rows, cols.

# CP437 lookup

As `glyphs_from` will be run primarily on actual glyph changes, this won't happen every single frame.
I.e., for most frames, there will be a sequence of terminal->blit cals, which should ideally just copy Uint32Array values.
However, to make glyphs_from as speedy as possible (looking up from UTF-8 / UTF-16 JS chars to the code point in CP437),
a Uint8Array should be sized to the greatest unicode value present in CP437, and populated at each unicode code point with the code point in CP437.
Then, lookup is simply `uint8arr[c.codePointAt(0)]` which will be very, very fast.

# terminal.ts

Terminal should become the renderer: any draw calls receive these "slices" at an offset, and essentially "blit"s onto the screen.
E.g., terminal->blit(glyphs, src_rect, dst_rect)
Thus, renderer.ts should be deleted and refactored into an updated terminal.ts.

# [moderndos-8x16](https://susam.github.io/pcface/#moderndos-8x16)

This font can be embedded into JS directly, and bound as a texture, where each byte in the image corresponds to a row.
This should be done in textures.ts: MODERNDOS_8X16_TEXTURE.
All box drawing characters should be rendered using this font, rather than the larger font which should be just for real glyphs.
Additionally, while loading the glyph atlas, this font should be used to render the terminal as a fallback.

# Replicate VGA characters

Each character on a screen should be communicated to the GPU program as 3-bytes each glyph:

- 1st byte: foreground
- 2nd byte: background
- 3rd byte: code point (index into glyph texture)

# Vertex Array Objects (VAOs)

Use this to store all the attrib information instead of re-binding everything.
This should be done throughout the project as a general practice.

# Instancing (Glyph Renderer only)

Provide the glyph information once per glyph:

- Call drawArraysInstanced to generate 6 vertices per attribute instance.
- Call gl.vertexAttribDivisor with args {attrib, 1} so each attribute advances once per instance (every 6 vertices)
- Use gl_VertexID in the vertex shader to automagically generate UV coordinates into the glyph texture for each vertex
