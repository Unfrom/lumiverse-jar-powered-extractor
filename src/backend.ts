/**
 * Lumiverse Spindle Backend Module
 * JAR Character Ripper
 */

declare const spindle: any;

interface JarRequestOptions {
  method?: string;
  body?: any;
  baseUrl?: string;
}

const DEFAULT_JAR_URL = 'http://localhost:4577';

/**
 * Make an HTTP request to the local JAR server.
 * Uses spindle.cors (with cors_proxy permission) to query loopback address,
 * with graceful fallback to native fetch in Bun.
 */
async function callJar(apiPath: string, options: JarRequestOptions = {}): Promise<any> {
  const baseUrl = (options.baseUrl || DEFAULT_JAR_URL).replace(/\/$/, '');
  const url = `${baseUrl}${apiPath}`;
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  let bodyStr: string | undefined;

  if (options.body) {
    headers['Content-Type'] = 'application/json';
    bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    if (typeof spindle !== 'undefined' && spindle.cors) {
      const res = await spindle.cors(url, {
        method,
        headers,
        body: bodyStr,
      });

      if (res.status >= 400) {
        let errMessage = `HTTP ${res.status}: ${res.statusText || 'Error'}`;
        try {
          const errObj = JSON.parse(res.body);
          if (errObj.error) errMessage = errObj.error;
        } catch (_) {}
        throw new Error(errMessage);
      }

      if (!res.body) return null;
      return JSON.parse(res.body);
    }
  } catch (err: any) {
    if (err.message && err.message.startsWith('HTTP')) {
      throw err;
    }
    // Fallback if spindle.cors has issues or is unavailable
  }

  // Native fetch fallback
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: bodyStr,
    });

    if (!res.ok) {
      let errMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errObj = await res.json();
        if (errObj.error) errMessage = errObj.error;
      } catch (_) {}
      throw new Error(errMessage);
    }

    return await res.json();
  } catch (err: any) {
    throw new Error(`Cannot reach JAR server at ${baseUrl}. Ensure JAR is running: ${err.message}`);
  }
}

/**
 * Normalize lorebook entries from either SillyTavern worldInfo shape or JAR publicLorebooks
 */
function extractEntriesFromLorebook(worldInfo: any, publicLorebooks: any[]): any[] {
  const entries: any[] = [];

  // SillyTavern / JAR worldInfo object: { entries: { "1": { ... }, "2": { ... } } }
  if (worldInfo && typeof worldInfo === 'object') {
    const rawEntries = worldInfo.entries;
    if (Array.isArray(rawEntries)) {
      entries.push(...rawEntries);
    } else if (rawEntries && typeof rawEntries === 'object') {
      entries.push(...Object.values(rawEntries));
    }
  }

  // Public lorebooks array from JAR
  if (Array.isArray(publicLorebooks)) {
    for (const book of publicLorebooks) {
      if (Array.isArray(book?.entries)) {
        entries.push(...book.entries);
      }
    }
  }

  return entries;
}

/**
 * Main backend message router
 */
if (typeof spindle !== 'undefined' && spindle.onFrontendMessage) {
  spindle.onFrontendMessage(async (payload: any, userId?: string) => {
    if (!payload || !payload.type) return;

    try {
      switch (payload.type) {
        case 'jar_get_status': {
          const baseUrl = payload.baseUrl || DEFAULT_JAR_URL;
          try {
            const status = await callJar('/api/status', { baseUrl });
            let version = 'unknown';
            try {
              const v = await callJar('/api/version', { baseUrl });
              if (v?.version) version = v.version;
            } catch (_) {}

            spindle.sendToFrontend({
              type: 'jar_status_result',
              online: true,
              version,
              ready: status?.ready ?? false,
              loggedIn: status?.loggedIn ?? false,
            }, userId);
          } catch (err: any) {
            spindle.sendToFrontend({
              type: 'jar_status_result',
              online: false,
              error: err.message,
            }, userId);
          }
          break;
        }

        case 'jar_search': {
          const { query, page, sort, mode, baseUrl } = payload;
          const params = new URLSearchParams();
          if (query) params.set('query', query);
          if (page) params.set('page', String(page));
          if (sort) params.set('sort', String(sort));
          if (mode) params.set('mode', String(mode));

          const data = await callJar(`/api/search?${params.toString()}`, { baseUrl });
          spindle.sendToFrontend({
            type: 'jar_search_result',
            success: true,
            data,
          }, userId);
          break;
        }

        case 'jar_inspect': {
          const { url, baseUrl } = payload;
          if (!url) throw new Error('URL or Character ID is required');

          const data = await callJar('/api/inspect', {
            method: 'POST',
            body: { url },
            baseUrl,
          });

          spindle.sendToFrontend({
            type: 'jar_inspect_result',
            success: true,
            data,
          }, userId);
          break;
        }

        case 'jar_capture': {
          const { id, force, trigger, baseUrl } = payload;
          if (!id) throw new Error('Capture Record ID is required');

          const data = await callJar('/api/capture', {
            method: 'POST',
            body: { id, force: !!force, trigger },
            baseUrl,
          });

          spindle.sendToFrontend({
            type: 'jar_capture_result',
            success: true,
            data,
          }, userId);
          break;
        }

        case 'jar_list_captures': {
          const { baseUrl } = payload;
          const captures = await callJar('/api/captures', { baseUrl });
          spindle.sendToFrontend({
            type: 'jar_list_captures_result',
            captures: Array.isArray(captures) ? captures : [],
          }, userId);
          break;
        }

        case 'jar_get_capture': {
          const { id, baseUrl } = payload;
          if (!id) throw new Error('Capture ID is required');
          const capture = await callJar(`/api/captures/${id}`, { baseUrl });
          spindle.sendToFrontend({
            type: 'jar_get_capture_result',
            capture,
          }, userId);
          break;
        }

        case 'import_to_lumiverse': {
          const { character, avatarBase64, worldInfo, publicLorebooks, sourceUrl } = payload;
          if (!character || !character.name) {
            throw new Error('Valid character object with name is required');
          }

          // 1. Create the Character Card in Lumiverse
          const tags = Array.isArray(character.tags)
            ? character.tags
            : (character.tags ? String(character.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []);

          const altGreetings = Array.isArray(character.alternateGreetings)
            ? character.alternateGreetings
            : (Array.isArray(character.alternate_greetings) ? character.alternate_greetings : []);

          const charPayload: any = {
            name: character.name.trim(),
            description: character.description || '',
            personality: character.personality || '',
            scenario: character.scenario || '',
            first_mes: character.firstMessage || character.first_mes || '',
            mes_example: character.exampleMessages || character.mes_example || '',
            creator_notes: character.creatorNotes || character.creator_notes || (sourceUrl ? `Imported from JanitorAI: ${sourceUrl}` : 'Imported via JAR Ripper'),
            tags,
            alternate_greetings: altGreetings,
            creator: character.creator || 'JanitorAI (JAR Extracted)',
            extensions: {
              jar_ripper: {
                source_url: sourceUrl || '',
                imported_at: Date.now(),
                definition_source: character.definitionSource || 'extracted',
              },
            },
          };

          const newChar = await spindle.characters.create(charPayload);
          if (!newChar || !newChar.id) {
            throw new Error('Failed to create character in Lumiverse');
          }

          let uploadedImageId: string | null = null;

          // 2. Upload Avatar Image if provided
          if (avatarBase64 && typeof avatarBase64 === 'string' && avatarBase64.startsWith('data:image/')) {
            try {
              if (spindle.images?.uploadFromDataUrl) {
                const img = await spindle.images.uploadFromDataUrl(avatarBase64, {
                  originalFilename: `${character.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_avatar.png`,
                  owner_character_id: newChar.id,
                });
                if (img && img.id) {
                  uploadedImageId = img.id;
                  // Associate image with character
                  try {
                    await spindle.characters.update(newChar.id, {
                      image_id: img.id,
                    });
                  } catch (_) {}
                }
              }
            } catch (err: any) {
              spindle.log.warn?.(`Avatar upload warning: ${err.message}`);
            }
          }

          // 3. Create Lorebook / World Book in Lumiverse if entries exist
          const rawEntries = extractEntriesFromLorebook(worldInfo, publicLorebooks);
          let createdWorldBookId: string | null = null;
          let importedEntryCount = 0;

          if (rawEntries.length > 0 && spindle.world_books?.create) {
            try {
              const bookName = `${character.name} Lorebook`;
              const worldBook = await spindle.world_books.create({
                name: bookName,
                description: `Extracted knowledge base for ${character.name}`,
              });

              if (worldBook && worldBook.id) {
                createdWorldBookId = worldBook.id;

                for (const entry of rawEntries) {
                  const keys = Array.isArray(entry.key) ? entry.key : (Array.isArray(entry.keys) ? entry.keys : []);
                  const content = entry.content || '';
                  if (!content && keys.length === 0) continue;

                  const secondaryKeys = Array.isArray(entry.keysecondary)
                    ? entry.keysecondary
                    : (Array.isArray(entry.secondary_keys) ? entry.secondary_keys : []);

                  await spindle.world_books.entries.create(worldBook.id, {
                    comment: entry.comment || entry.title || entry.name || 'Lore Entry',
                    key: keys.map((k: any) => String(k).trim()).filter(Boolean),
                    keysecondary: secondaryKeys.map((k: any) => String(k).trim()).filter(Boolean),
                    content: String(content),
                    selective: !!entry.selective,
                    constant: !!entry.constant,
                    position: typeof entry.position === 'number' ? entry.position : 0,
                  });
                  importedEntryCount++;
                }

                // Link World Book to the character
                await spindle.characters.update(newChar.id, {
                  world_book_ids: [worldBook.id],
                });
              }
            } catch (err: any) {
              spindle.log.warn?.(`World book creation warning: ${err.message}`);
            }
          }

          if (spindle.toast?.success) {
            const extra = importedEntryCount > 0 ? ` with ${importedEntryCount} lorebook entries` : '';
            spindle.toast.success(`Character "${character.name}" imported to Lumiverse${extra}!`);
          }

          spindle.sendToFrontend({
            type: 'import_result',
            success: true,
            characterId: newChar.id,
            characterName: character.name,
            imageId: uploadedImageId,
            worldBookId: createdWorldBookId,
            entryCount: importedEntryCount,
          }, userId);
          break;
        }

        default:
          break;
      }
    } catch (err: any) {
      spindle.log.error?.(`[JAR Backend] Error handling ${payload.type}: ${err.message}`);
      spindle.sendToFrontend({
        type: `${payload.type}_error`,
        error: err.message || String(err),
      }, userId);
    }
  });
}
