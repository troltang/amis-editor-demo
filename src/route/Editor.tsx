//import React from 'react';
import {Editor, ShortcutKey} from 'amis-editor';
import {inject, observer} from 'mobx-react';
import {RouteComponentProps} from 'react-router-dom';
import {toast, Select} from 'amis';
import {currentLocale} from 'i18n-runtime';
import {Icon} from '../icons/index';
import {IMainStore} from '../store';
import '../editor/DisabledEditorPlugin'; // 用于隐藏一些不需要的Editor预置组件
import '../renderer/MyRenderer';
import '../editor/MyRenderer';
import React, { useEffect, useState } from 'react';
let currentIndex = -1;

let host = `${window.location.protocol}//${window.location.host}`;

// 如果在 gh-pages 里面
if (/^\/amis-editor-demo/.test(window.location.pathname)) {
  host += '/amis-editor';
}

const schemaUrl = `${host}/schema.json`;

const editorLanguages = [
  {
    label: '简体中文',
    value: 'zh-CN'
  },
  {
    label: 'English',
    value: 'en-US'
  }
];

export default inject('store')(
  observer(function ({
    store,
    location,
    history,
    match
  }: {store: IMainStore} & RouteComponentProps<{id: string}>) {
    const index: number = parseInt(match.params.id, 10);
    const pageId =match.params.id;// store.pages[index]?.id;
    const [loading, setLoading] = useState(true);

    const curLanguage = currentLocale();

    useEffect(() => {
      if (!pageId) return;

      setLoading(true);
      fetch(`/api/page/get?id=${pageId}`, {
		  method: 'GET',
		  headers: {
			'Accept': 'application/json, text/plain, */*'
		  }
		})
        .then(res => res.json())
        .then(res => {
          if (res.status === 0) {
            const schema = typeof res.data.schema === 'string'
              ? JSON.parse(res.data.schema)
              : res.data.schema;

            store.updateSchema(schema);
			store.updatePageSchemaAt(index); // 仍然调用一次存储到当前页面中

          } else {
			
            toast.error('获取页面数据失败: ' + res.msg, '错误');
          }
        })
        .catch(err => {
          console.error(err);
          toast.error('获取页面异常: ' + err.message, '错误');
        })
        .finally(() => {
          setLoading(false);
        });
		
		// fetch('/api/page', {
		  // method: 'GET',
		  // headers: {
			// 'Accept': 'application/json, text/plain, */*'
		  // }
		// })
		  // .then((response) => response.json()) // 这里建议加回来，否则拿不到 response.data
		  // .then((res: any) => {
			// if (res?.status === 0 && Array.isArray(res.data)) {
			  // const newPages = res.data.map((item: any) => ({
				// id: `${item.id}`,
				// path: item.path,
				// label: item.label || '',
				// icon: item.icon || 'fa fa-file',
				// schema: item.schema
			  // }));

			  // applySnapshot(self.pages, newPages);
			// }
		  // })
		  // .catch((err: any) => {
			// console.error('页面列表获取失败', err);
			// env.notify?.('error', '获取页面列表失败');
		  // });
		
    }, [pageId, index, store]);
	
	
    function save() {
      store.updatePageSchemaAt(index);

	  const page = store.pages[index]; // 获取当前页面
	  const schema = page.schema;
	  //const pageId =match.params.id;// store.pages[index]?.id;
	  // 👇 添加你自己的保存接口调用
	  fetch('/api/page/save', {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json'
		},
		body: JSON.stringify({
		  id: pageId,
		  schema: schema
		})
	  })
    .then(res => res.json())
    .then(res => {
      if (res.status === 0) {
        toast.success('保存成功', '提示');
      } else {
        toast.error('保存失败: ' + res.msg, '错误');
      }
    })
    .catch(err => {
      console.error(err);
      toast.error('保存异常: ' + err.message, '错误');
    });
      //toast.success('保存成功', '提示');
    }

    function onChange(value: any) {
      store.updateSchema(value);
      store.updatePageSchemaAt(index);
    }

    function changeLocale(value: string) {
      localStorage.setItem('suda-i18n-locale', value);
      window.location.reload();
    }

    function exit() {
      history.push(`/${store.pages[index].path}`);
    }

    return (
      <div className="Editor-Demo">
        <div className="Editor-header">
          <div className="Editor-title">amis 可视化编辑器</div>
          <div className="Editor-view-mode-group-container">
            <div className="Editor-view-mode-group">
              <div
                className={`Editor-view-mode-btn editor-header-icon ${
                  !store.isMobile ? 'is-active' : ''
                }`}
                onClick={() => {
                  store.setIsMobile(false);
                }}
              >
                <Icon icon="pc-preview" title="PC模式" />
              </div>
              <div
                className={`Editor-view-mode-btn editor-header-icon ${
                  store.isMobile ? 'is-active' : ''
                }`}
                onClick={() => {
                  store.setIsMobile(true);
                }}
              >
                <Icon icon="h5-preview" title="移动模式" />
              </div>
            </div>
          </div>

          <div className="Editor-header-actions">
            <ShortcutKey />
            <Select
              className="margin-left-space"
              options={editorLanguages}
              value={curLanguage}
              clearable={false}
              onChange={(e: any) => changeLocale(e.value)}
            />
            <div
              className={`header-action-btn m-1 ${
                store.preview ? 'primary' : ''
              }`}
              onClick={() => {
                store.setPreview(!store.preview);
              }}
            >
              {store.preview ? '编辑' : '预览'}
            </div>
            {!store.preview && (
              <div className={`header-action-btn exit-btn`} onClick={exit}>
                退出
              </div>
            )}
	     <div className={`header-action-btn save-btn`} onClick={save}>
                保存
              </div>
          </div>
        </div>
        <div className="Editor-inner">
          <Editor
            theme={'cxd'}
            preview={store.preview}
            isMobile={store.isMobile}
            value={store.schema}
            onChange={onChange}
            onPreview={() => {
              store.setPreview(true);
            }}
            onSave={save}
            className="is-fixed"
            $schemaUrl={schemaUrl}
            showCustomRenderersPanel={true}
            amisEnv={{
              fetcher: store.fetcher,
              notify: store.notify,
              alert: store.alert,
              copy: store.copy
            }}
          />
        </div>
      </div>
    );
  })
);
