import {useEditor} from '@portabletext/editor'
import type {EditorSchema} from '@portabletext/editor'
import {CharacterPairDecoratorPlugin} from '@portabletext/plugin-character-pair-decorator'
import {useEffect} from 'react'
import {
  createMarkdownBehaviors,
  type MarkdownBehaviorsConfig,
} from './behavior.markdown-shortcuts'

/**
 * @beta
 */
export type MarkdownShortcutsPluginProps = MarkdownBehaviorsConfig & {
  boldDecorator?: ({schema}: {schema: EditorSchema}) => string | undefined
  codeDecorator?: ({schema}: {schema: EditorSchema}) => string | undefined
  italicDecorator?: ({schema}: {schema: EditorSchema}) => string | undefined
  strikeThroughDecorator?: ({
    schema,
  }: {
    schema: EditorSchema
  }) => string | undefined
}

/**
 * @beta
 */
export function MarkdownShortcutsPlugin(props: MarkdownShortcutsPluginProps) {
  const editor = useEditor()

  useEffect(() => {
    const behaviors = createMarkdownBehaviors(props)

    const unregisterBehaviors = behaviors.map((behavior) =>
      editor.registerBehavior({behavior}),
    )

    return () => {
      for (const unregisterBehavior of unregisterBehaviors) {
        unregisterBehavior()
      }
    }
  }, [editor, props])

  return (
    <>
      {props.boldDecorator ? (
        <>
          <CharacterPairDecoratorPlugin
            decorator={props.boldDecorator}
            pair={{char: '*', amount: 2}}
          />
          <CharacterPairDecoratorPlugin
            decorator={props.boldDecorator}
            pair={{char: '_', amount: 2}}
          />
        </>
      ) : null}
      {props.codeDecorator ? (
        <CharacterPairDecoratorPlugin
          decorator={props.codeDecorator}
          pair={{char: '`', amount: 1}}
        />
      ) : null}
      {props.italicDecorator ? (
        <>
          <CharacterPairDecoratorPlugin
            decorator={props.italicDecorator}
            pair={{char: '*', amount: 1}}
          />
          <CharacterPairDecoratorPlugin
            decorator={props.italicDecorator}
            pair={{char: '_', amount: 1}}
          />
        </>
      ) : null}
      {props.strikeThroughDecorator ? (
        <CharacterPairDecoratorPlugin
          decorator={props.strikeThroughDecorator}
          pair={{char: '~', amount: 2}}
        />
      ) : null}
    </>
  )
}
