import {types, getEnv, applySnapshot, getSnapshot} from 'mobx-state-tree';
import {PageStore} from './Page';
import {when, reaction} from 'mobx';
let pagIndex = 1;
export const MainStore = types
  .model('MainStore', {
    pages: types.optional(types.array(PageStore), [
      {
        id: `${pagIndex}`,
        path: 'hello-world',
        label: 'Hello world',
        icon: 'fa fa-file',
        schema: {
          type: 'page',
          title: 'Hello world',
          body: '初始页面'
        }
      }
    ]),
    theme: 'cxd',
    asideFixed: true,
    asideFolded: false,
    offScreen: false,
    addPageIsOpen: false,
    preview: false,
    isMobile: false,
    schema: types.frozen()
  })
  .views(self => ({
    get fetcher() {
      return getEnv(self).fetcher;
    },
    get notify() {
      return getEnv(self).notify;
    },
    get alert() {
      return getEnv(self).alert;
    },
    get copy() {
      return getEnv(self).copy;
    }
  }))
  .actions(self => {
    function toggleAsideFolded() {
      self.asideFolded = !self.asideFolded;
    }

    function toggleAsideFixed() {
      self.asideFixed = !self.asideFixed;
    }

    function toggleOffScreen() {
      self.offScreen = !self.offScreen;
    }

    function setAddPageIsOpen(isOpened: boolean) {
      self.addPageIsOpen = isOpened;
    }

    function addPage(data: {
      label: string;
      path: string;
      icon?: string;
      schema?: any;
    }) {
      self.pages.push(
        PageStore.create({
          ...data,
          id: `${++pagIndex}`
        })
      );
    }

    function removePageAt(index: number) {
      self.pages.splice(index, 1);
    }

    function updatePageSchemaAt(index: number) {
      self.pages[index].updateSchema(self.schema);
    }

    function updateSchema(value: any) {
      self.schema = value;
    }

    function setPreview(value: boolean) {
      self.preview = value;
    }

    function setIsMobile(value: boolean) {
      self.isMobile = value;
    }

    return {
      toggleAsideFolded,
      toggleAsideFixed,
      toggleOffScreen,
      setAddPageIsOpen,
      addPage,
      removePageAt,
      updatePageSchemaAt,
      updateSchema,
      setPreview,
      setIsMobile,
      // afterCreate() {
        ////persist store
        // if (typeof window !== 'undefined' && window.localStorage) {
          // const storeData = window.localStorage.getItem('store');
          // if (storeData) applySnapshot(self, JSON.parse(storeData));

          // reaction(
            // () => getSnapshot(self),
            // json => {
              // window.localStorage.setItem('store', JSON.stringify(json));
            // }
          // );
        // }
      // }
	  afterCreate() {
		  const env = getEnv(self);

		  if (env && env.fetcher) {
			fetch('http://localhost:300/api/page')
			  .then((response) => response.json())
			  .then((res: any) => {
				if (res?.status === 0 && Array.isArray(res.data)) {
				  const newPages = res.data.map((item: any) => ({
					id: `${item.id}`,
					path: item.path,
					label: item.label || '',
					icon: item.icon || 'fa fa-file',
					schema: item.schema
				  }));
					
				  // 使用 applySnapshot 更新整个 pages
				  applySnapshot(self.pages, newPages);

				  // 如果需要持久化
				  //const fullSnapshot = getSnapshot(self);
				  //window.localStorage.setItem('store', JSON.stringify(fullSnapshot));
				}
			  })
			  .catch((err: any) => {
				console.error('页面列表获取失败', err);
				env.notify?.('error', '获取页面列表失败');
			  });
		  }

		  // 本地数据持久化
		  // if (typeof window !== 'undefined' && window.localStorage) {
			// const storeData = window.localStorage.getItem('store');
			// if (storeData) applySnapshot(self, JSON.parse(storeData));

			// reaction(
			  // () => getSnapshot(self),
			  // (json) => {
				// window.localStorage.setItem('store', JSON.stringify(json));
			  // }
			// );
		  // }
		}
	  
	  /* afterCreate() {
		  const env = getEnv(self);

		  //1. 拉取页面列表初始化
		  if (env && env.fetcher) {
			  fetch('http://localhost:8080/api/pages') // 使用相对路径，确保 API 请求成功
				.then((response) => response.json())
				.then((res: any) => {
				
				  if (res?.status === 0 && Array.isArray(res.data)) {
				  const storesStr = window.localStorage.getItem('store');
				  const stores = JSON.parse(storesStr);
				  stores.pages=res.data;
				  //window.localStorage.setItem('store', JSON.stringify(stores));
				  //const storeData = window.localStorage.getItem('store');
				  console.log(stores);
					if (stores) applySnapshot(self, stores);
				  }
				})
				.catch((err: any) => {
				  console.error('页面列表获取失败', err);
				  env.notify('error', '获取页面列表失败');
				});
			}

		  //2. 自动本地持久化
		  //if (typeof window !== 'undefined' && window.localStorage) {
			// const storeData = window.localStorage.getItem('store');
			// if (storeData) applySnapshot(self, JSON.parse(storeData));

			// reaction(
			  // () => getSnapshot(self),
			  // json => {
				// window.localStorage.setItem('store', JSON.stringify(json));
			  // }
			// );
		  //}
		} */
    };
  });

export type IMainStore = typeof MainStore.Type;
