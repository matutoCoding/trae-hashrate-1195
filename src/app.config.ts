export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/batch/index',
    'pages/recall/index',
    'pages/queue/index',
    'pages/batch-detail/index',
    'pages/recall-detail/index',
    'pages/ticket-detail/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '换电调度',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F7FA',
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#0FC6C2',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '工作台',
      },
      {
        pagePath: 'pages/batch/index',
        text: '批次管理',
      },
      {
        pagePath: 'pages/recall/index',
        text: '流向召回',
      },
      {
        pagePath: 'pages/queue/index',
        text: '排队叫号',
      },
    ],
  },
});
