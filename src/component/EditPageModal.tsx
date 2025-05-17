import React from 'react';
import { schema2component } from './AMISRenderer';
import axios from 'axios';

export default schema2component(
  {
    type: 'dialog',
    title: '编辑页面属性',
    body: {
      type: 'form',
      controls: [
        {
          type: 'text',
          label: '名称',
          name: 'label',
          validations: {
            maxLength: 20
          },
          required: true
        },
        {
          type: 'text',
          label: '路径',
          name: 'path',
          validations: {
            isUrlPath: true
          },
          required: true,
          validate(values: any, value: string) {
            // Ensure that `values` is not undefined and `pages` is properly initialized
            const pages = values?.pages || [];
            const exists = pages.some((item: any) => item.path === value);
            return exists ? '当前路径已被占用，请换一个' : '';
          }
        },
        {
          type: 'icon-picker',
          label: '图标',
          name: 'icon'
        }
      ]
    }
  },
  ({ onConfirm, pages, page, ...rest }: any) => {
    const handleConfirm = async (values: Array<any>) => {
	  try {
		const updatedData = values[0];

		const response = await axios.put(
		  `/api/page/${page.id}`,
		  updatedData,
		  {
			headers: {
			  'Content-Type': 'application/json',
			  'Accept': 'application/json',
			}
		  }
		);

		if (response.status === 200) {
		  onConfirm && onConfirm(updatedData);
		} else {
		  console.error('更新失败', response.data);
		}
	  } catch (error) {
		console.error('更新时发生错误', error);
	  }
	};

    return {
      ...rest,
      data: {
        pages,
        ...page // 将当前编辑的页面数据作为初始数据
      },
      onConfirm: handleConfirm // 使用自定义的 handleConfirm 函数
    };
  }
);
