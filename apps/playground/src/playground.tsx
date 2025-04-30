import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  type RenderPlaceholderFunction,
} from '@portabletext/editor'
import {EventListenerPlugin} from '@portabletext/editor/plugins'
import {OneLinePlugin} from '@portabletext/plugin-one-line'
import {createStore} from '@xstate/store'
import {useSelector} from '@xstate/store/react'

const featureFlags = createStore({
  context: {
    enableOneLinePlugin: false,
  },
  on: {
    toggleOneLinePlugin: (context) => ({
      ...context,
      enableOneLinePlugin: !context.enableOneLinePlugin,
    }),
  },
})

export function Playground() {
  const enableOneLinePlugin = useSelector(
    featureFlags,
    (s) => s.context.enableOneLinePlugin,
  )

  return (
    <>
      <div>
        <EditorProvider initialConfig={{schemaDefinition: defineSchema({})}}>
          <PortableTextEditable
            style={{
              border: '1px solid black',
            }}
            renderPlaceholder={renderPlaceholder}
          />
          <EventListenerPlugin on={console.info} />
          {enableOneLinePlugin ? <OneLinePlugin /> : null}
        </EditorProvider>
      </div>
      <div>
        Plugins:
        <ol>
          <li>
            <input
              type="checkbox"
              checked={enableOneLinePlugin}
              onChange={() => {
                featureFlags.trigger.toggleOneLinePlugin()
              }}
            />
            One-Line Plugin
          </li>
        </ol>
      </div>
    </>
  )
}

const renderPlaceholder: RenderPlaceholderFunction = () => {
  return <span>Type something</span>
}
