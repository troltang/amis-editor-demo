//import React, { useState } from 'react';
import { observer, inject } from 'mobx-react';
import { IMainStore } from '../store';
import { Button, AsideNav, Layout, confirm, render as renderAmis } from 'amis';
import { RouteComponentProps, matchPath, Switch, Route } from 'react-router';
import { Link } from 'react-router-dom';
import NotFound from './NotFound';
import AMISRenderer from '../component/AMISRenderer';
import AddPageModal from '../component/AddPageModal';
import EditPageModal from '../component/EditPageModal';
import axios from 'axios';
import React, { useState, useEffect } from 'react';

function isActive(link: any, location: any) {
  const ret = matchPath(location?.pathname, {
    path: link ? link.replace(/\?.*$/, '') : '',
    exact: true,
    strict: true
  });
  return !!ret;
}

export default inject('store')(
  observer(function ({
    store,
    location,
    history
  }: { store: IMainStore } & RouteComponentProps) {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<any>(null);
	
	//增加点击菜单加载页面数据
	const [pageSchema, setPageSchema] = useState<any>(null);
	const [loadingSchema, setLoadingSchema] = useState(false);

	useEffect(() => {
	  const match = store.pages.find(p => `/${p.path}` === location.pathname);
	  if (!match) {
		console.warn('未匹配页面路径:', location.pathname);
		setPageSchema(null);
		return;
	  }

	  setLoadingSchema(true);
	  axios
		.get(`http://localhost:300/api/page/get?id=${match.id}`)
		.then(res => {
		  const rawSchema = res.data.data.schema;
		  const parsed = typeof rawSchema === 'string' ? JSON.parse(rawSchema) : rawSchema;
		  console.log('成功加载 schema:', parsed);
		  store.updateSchema(parsed);
		  setPageSchema(parsed);
		})
		.catch(err => {
		  console.error('加载页面 schema 失败:', err);
		  setPageSchema(null);
		})
		.finally(() => setLoadingSchema(false));
	}, [location.pathname]);
	
    function renderHeader() {
      return (
        <>
          <div className={`cxd-Layout-brandBar`}>
            <div className="cxd-Layout-brand text-ellipsis">
              <i className="fa fa-paw"></i>
              <span className="hidden-folded m-l-sm">可视化编辑器</span>
            </div>
          </div>
          <div className={`cxd-Layout-headerBar`}>
            <div className="hidden-xs p-t-sm ml-auto px-2">
              <Button size="sm" className="m-r-xs" level="success">
                全部导出
              </Button>
              <Button
                size="sm"
                level="info"
                onClick={() => store.setAddPageIsOpen(true)}
              >
                新增页面
              </Button>
            </div>
          </div>
        </>
      );
    }

    function renderAside() {
      const navigations = store.pages.map(item => ({
        label: item.label,
        path: `/${item.path}`,
        icon: item.icon
      }));
      const paths = navigations.map(item => item.path);

      return (
        <AsideNav
          key={store.asideFolded ? 'folded-aside' : 'aside'}
          navigations={[
            {
              label: '导航',
              children: navigations
            }
          ]}
          renderLink={({ link, toggleExpand, classnames: cx, depth }: any) => {
            if (link.hidden) {
              return null;
            }

            const index = paths.indexOf(link.path);
            const page = store.pages[index];

            let children = [];

            if (link.children) {
              children.push(
                <span
                  key="expand-toggle"
                  className={cx('AsideNav-itemArrow')}
                  onClick={e => toggleExpand(link, e)}
                ></span>
              );
            }

            link.badge &&
              children.push(
                <b
                  key="badge"
                  className={cx(
                    `AsideNav-itemBadge`,
                    link.badgeClassName || 'bg-info'
                  )}
                >
                  {link.badge}
                </b>
              );

            if (link.icon) {
              children.push(
                <i key="icon" className={cx(`AsideNav-itemIcon`, link.icon)} />
              );
            } else if (store.asideFolded && depth === 1) {
              children.push(
                <i
                  key="icon"
                  className={cx(
                    `AsideNav-itemIcon`,
                    link.children ? 'fa fa-folder' : 'fa fa-info'
                  )}
                />
              );
            }

            // 删除按钮
            if (!link.active) {
              children.push(
                <i
				  key="delete"
				  data-tooltip="删除"
				  data-position="bottom"
				  className={'navbtn fa fa-times'}
				  onClick={async (e: React.MouseEvent) => {
					e.preventDefault();
					const confirmed = await confirm('确认要删除？');
					if (!confirmed) return;

					try {
					  const pageId = page.id;
					  //await axios.delete(`http://localhost:300/api/page/${pageId}`);
					  
					  const response = await axios.delete(
						  `http://localhost:300/api/page/${pageId}`,
						  {
							headers: {
							  'Content-Type': 'application/json',
							  'Accept': 'application/json',
							}
						  }
						);
					  store.removePageAt(index); // 可选：删除成功后再更新本地 store
					} catch (error) {
					  console.error('删除失败:', error);
					  alert('删除失败，请稍后再试。');
					}
				  }}
				/>
              );
            }
			
			
            // 编辑 schema 按钮
            children.push(
              <i
                key="edit-content"
                data-tooltip="编辑页面内容"
                data-position="bottom"
                className={'navbtn fa fa-pencil'}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  history.push(`/edit/${index}`);
                }}
              />
            );

            // 编辑属性按钮
            children.push(
              <i
                key="edit-props"
                data-tooltip="编辑页面属性"
                data-position="bottom"
                className={'navbtn fa fa-cog'}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  setEditTarget(page);
                  setEditModalOpen(true);
                }}
              />
            );

            children.push(
              <span key="label" className={cx('AsideNav-itemLabel')}>
                {link.label}
              </span>
            );

            return link.path ? (
              link.active ? (
                <a>{children}</a>
              ) : (
                <Link to={link.path[0] === '/' ? link.path : `${link.path}`}>
                  {children}
                </Link>
              )
            ) : (
              <a
                onClick={
                  link.onClick
                    ? link.onClick
                    : link.children
                    ? () => toggleExpand(link)
                    : undefined
                }
              >
                {children}
              </a>
            );
          }}
          isActive={(link: any) =>
            isActive(
              link.path && link.path[0] === '/' ? link.path : `${link.path}`,
              location
            )
          }
        />
      );
    }

    function handleConfirm(value: { label: string; icon: string; path: string }) {
      store.addPage({
        ...value,
        schema: {
          type: 'page',
          title: value.label,
          body: '这是你刚刚新增的页面。'
        }
      });
      store.setAddPageIsOpen(false);
    }

    function handleEditConfirm(value: { label: string; icon: string; path: string }) {
      if (editTarget) {
        const index = store.pages.findIndex(p => p.id === editTarget.id);
        if (index > -1) {
          store.pages[index].label = value.label;
          store.pages[index].icon = value.icon;
          store.pages[index].path = value.path;
        }
      }
      setEditModalOpen(false);
    }

    return (
      <Layout
        aside={renderAside()}
        header={renderHeader()}
        folded={store.asideFolded}
        offScreen={store.offScreen}
      >
        <Switch>

		  //动态加载页面
		  <Route
			path="*"
			render={() =>
			  loadingSchema ? (
				<div className="p-4 text-muted">加载中...</div>
			  ) : pageSchema ? (
				<AMISRenderer schema={pageSchema} />
			  ) : (
				<div className="p-4 text-danger">页面加载失败或无数据。</div>
			  )
			}
		  />
        </Switch>
        <AddPageModal
          show={store.addPageIsOpen}
          onClose={() => store.setAddPageIsOpen(false)}
          onConfirm={handleConfirm}
          pages={store.pages.concat()}
        />
        <EditPageModal
          show={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onConfirm={handleEditConfirm}
          page={editTarget}
        />
      </Layout>
    );
  })
);
