import {
  useEditor,
  type PortableTextBlock,
  type Patch as PtePatch,
} from '@portabletext/editor'
import {
  type JSONValue,
  type InsertPatch as PteInsertPatch,
} from '@portabletext/patches'
import {diffValue, type SanityPatchOperations} from '@sanity/diff-patch'
import {jsonMatch} from '@sanity/json-match'
import {
  getDocumentState,
  useEditDocument,
  useSanityInstance,
  type DocumentHandle,
} from '@sanity/sdk-react'
import {useEffect} from 'react'

interface SDKValuePluginProps extends DocumentHandle {
  path: string
}

type InsertPatch = Required<Pick<SanityPatchOperations, 'insert'>>

function createPtePatches(
  snapshot: PortableTextBlock[],
  target: PortableTextBlock[] | null | undefined,
): PtePatch[] {
  return diffValue(snapshot, target).flatMap((p) => {
    return Object.entries(p).flatMap(([type, values]): PtePatch[] => {
      const origin = 'remote'

      switch (type) {
        case 'set':
        case 'setIfMissing':
        case 'diffMatchPatch':
        case 'inc':
        case 'dec': {
          return Object.entries(values).flatMap(([pathExpr, value]) =>
            Array.from(jsonMatch(target, pathExpr)).map(
              ({path}) => ({type, origin, path, value}) as PtePatch,
            ),
          )
        }
        case 'unset': {
          if (!Array.isArray(values)) return []
          return values.flatMap((pathExpr) =>
            Array.from(jsonMatch(target, pathExpr)).map(({path}) => ({
              type,
              origin,
              path,
            })),
          )
        }
        case 'insert': {
          const {items, ...rest} = values as InsertPatch['insert']
          type InsertPosition = PteInsertPatch['position']
          const position = Object.keys(rest).at(0) as InsertPosition | undefined

          if (!position) return []
          const pathExpr = (rest as {[K in InsertPosition]: string})[position]

          return Array.from(jsonMatch(target, pathExpr)).map(
            ({path}): PteInsertPatch => ({
              type,
              origin,
              position,
              path,
              items: items as JSONValue[],
            }),
          )
        }

        default: {
          return []
        }
      }
    })
  })
}
/**
 * @public
 */
export function SDKValuePlugin(props: SDKValuePluginProps) {
  // `useEditDocument` suspends until the document is loaded into the SDK store
  const setSdkValue = useEditDocument(props)
  const instance = useSanityInstance(props)
  const editor = useEditor()

  useEffect(() => {
    const getEditorValue = () => editor.getSnapshot().context.value
    const {getCurrent: getSdkValue, subscribe: onSdkValueChange} =
      getDocumentState<PortableTextBlock[]>(instance, props)

    const editorSubscription = editor.on('patch', () =>
      setSdkValue(getEditorValue()),
    )
    const unsubscribeToEditorChanges = () => editorSubscription.unsubscribe()
    const unsubscribeToSdkChanges = onSdkValueChange(() => {
      const snapshot = getEditorValue()
      const patches = createPtePatches(snapshot, getSdkValue())

      if (patches.length) {
        editor.send({type: 'patches', patches, snapshot})
      }
    })

    // update initial value
    editor.send({type: 'update value', value: getSdkValue() ?? []})

    return () => {
      unsubscribeToEditorChanges()
      unsubscribeToSdkChanges()
    }
  }, [setSdkValue, editor, instance, props])

  return null
}
