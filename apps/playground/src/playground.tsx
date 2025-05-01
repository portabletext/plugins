import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  type PortableTextBlock,
  type RenderDecoratorFunction,
  type RenderPlaceholderFunction,
} from '@portabletext/editor'
import {EventListenerPlugin} from '@portabletext/editor/plugins'
import {CharacterPairDecoratorPlugin} from '@portabletext/plugin-character-pair-decorator'
import {MarkdownShortcutsPlugin} from '@portabletext/plugin-markdown-shortcuts'
import {OneLinePlugin} from '@portabletext/plugin-one-line'
import {createStore} from '@xstate/store'
import {useSelector} from '@xstate/store/react'
import {useState} from 'react'

const schemaDefinition = defineSchema({
  blockObjects: [{name: 'break'}],
  decorators: [
    {name: 'em'},
    {name: 'code'},
    {name: 'strike-through'},
    {name: 'strong'},
  ],
  lists: [{name: 'bullet'}, {name: 'number'}],
  styles: [
    {name: 'normal'},
    {name: 'h1'},
    {name: 'h2'},
    {name: 'h3'},
    {name: 'h4'},
    {name: 'h5'},
    {name: 'h6'},
    {name: 'blockquote'},
  ],
})

const featureFlags = createStore({
  context: {
    enableCharacterPairDecoratorPlugin: false,
    enableMarkdownShortcutsPlugin: false,
    enableOneLinePlugin: false,
  },
  on: {
    toggleCharacterPairDecoratorPlugin: (context) => ({
      ...context,
      enableCharacterPairDecoratorPlugin:
        !context.enableCharacterPairDecoratorPlugin,
    }),
    toggleMarkdownShortcutsPlugin: (context) => ({
      ...context,
      enableMarkdownShortcutsPlugin: !context.enableMarkdownShortcutsPlugin,
    }),
    toggleOneLinePlugin: (context) => ({
      ...context,
      enableOneLinePlugin: !context.enableOneLinePlugin,
    }),
  },
})

export function Playground() {
  const enableCharacterPairDecoratorPlugin = useSelector(
    featureFlags,
    (s) => s.context.enableCharacterPairDecoratorPlugin,
  )
  const enableMarkdownShortcutsPlugin = useSelector(
    featureFlags,
    (s) => s.context.enableMarkdownShortcutsPlugin,
  )
  const enableOneLinePlugin = useSelector(
    featureFlags,
    (s) => s.context.enableOneLinePlugin,
  )
  const [value, setValue] = useState<Array<PortableTextBlock>>([])

  return (
    <>
      <div>
        <div>
          <EditorProvider
            initialConfig={{
              schemaDefinition,
              initialValue: value,
            }}
          >
            <PortableTextEditable
              style={{
                border: '1px solid black',
              }}
              renderDecorator={renderDecorator}
              renderPlaceholder={renderPlaceholder}
            />
            <EventListenerPlugin
              on={(event) => {
                console.info(event)

                if (event.type === 'mutation') {
                  setValue(event.value ?? [])
                }
              }}
            />
            {enableCharacterPairDecoratorPlugin ? (
              <CharacterPairDecoratorPlugin
                decorator={({schema}) =>
                  schema.decorators.find((d) => d.name === 'em')?.name
                }
                pair={{char: '#', amount: 1}}
              />
            ) : null}
            {enableMarkdownShortcutsPlugin ? (
              <MarkdownShortcutsPlugin
                boldDecorator={({schema}) =>
                  schema.decorators.find(
                    (decorator) => decorator.name === 'strong',
                  )?.name
                }
                codeDecorator={({schema}) =>
                  schema.decorators.find(
                    (decorator) => decorator.name === 'code',
                  )?.name
                }
                italicDecorator={({schema}) =>
                  schema.decorators.find((decorator) => decorator.name === 'em')
                    ?.name
                }
                strikeThroughDecorator={({schema}) =>
                  schema.decorators.find(
                    (decorator) => decorator.name === 'strike-through',
                  )?.name
                }
                defaultStyle={({schema}) =>
                  schema.styles.find((style) => style.name === 'normal')?.name
                }
                headingStyle={({schema, level}) =>
                  schema.styles.find((style) => style.name === `h${level}`)
                    ?.name
                }
                blockquoteStyle={({schema}) =>
                  schema.styles.find((style) => style.name === 'blockquote')
                    ?.name
                }
                orderedList={({schema}) =>
                  schema.lists.find((list) => list.name === 'number')?.name
                }
                unorderedList={({schema}) =>
                  schema.lists.find((list) => list.name === 'bullet')?.name
                }
                horizontalRuleObject={({schema}) => {
                  const name = schema.blockObjects.find(
                    (blockObject) => blockObject.name === 'break',
                  )?.name
                  return name ? {name} : undefined
                }}
              />
            ) : null}
            {enableOneLinePlugin ? <OneLinePlugin /> : null}
          </EditorProvider>
        </div>
        <div>
          Plugins:
          <ol>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={enableCharacterPairDecoratorPlugin}
                  onChange={() => {
                    featureFlags.trigger.toggleCharacterPairDecoratorPlugin()
                  }}
                />
                Character Pair Decorator Plugin (turn <code>#foo#</code> into{' '}
                <code>
                  <em>foo</em>
                </code>
                )
              </label>
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={enableMarkdownShortcutsPlugin}
                  onChange={() => {
                    featureFlags.trigger.toggleMarkdownShortcutsPlugin()
                  }}
                />
                Markdown Shortcuts Plugin
              </label>
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={enableOneLinePlugin}
                  onChange={() => {
                    featureFlags.trigger.toggleOneLinePlugin()
                  }}
                />
                One-Line Plugin
              </label>
            </li>
          </ol>
        </div>
      </div>
      <div>
        <pre>{JSON.stringify(value, null, 2)}</pre>
      </div>
    </>
  )
}

const renderDecorator: RenderDecoratorFunction = (props) => {
  if (props.value === 'em') {
    return <em>{props.children}</em>
  }
  if (props.value === 'strong') {
    return <strong>{props.children}</strong>
  }
  if (props.value === 'code') {
    return <code>{props.children}</code>
  }
  if (props.value === 'strike-through') {
    return <del>{props.children}</del>
  }
  return props.children
}

const renderPlaceholder: RenderPlaceholderFunction = () => {
  return <span>Type something</span>
}
